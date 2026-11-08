// Panel 2. Geometry uses the eight gross totals loaded by main.js.
// Spending lenses and receipts group signed expense lines from the same workbook.
const detailFile = new URL('../../data/operating_budget_2025_lines.csv', import.meta.url);
const all = 'All spending';
const swatches = ['--peach', '--rose', '--teal', '--lime'];
const programs = {
  'Toronto Transit Commission - Conventional': ['TTC conventional transit', 'TTC transit', 'category', 'item'],
  "Children's Services": ['Children’s Services', 'Child care', 'service_line', 'category'],
  'Toronto Police Service': ['Toronto Police Service', 'Police', 'category', 'item'],
  'Toronto Employment and Social Services': ['Employment & Social Services', 'Employment', 'service_line', 'activity'],
  'Toronto Shelter and Support Services': ['Shelter & Support Services', 'Shelters', 'activity', 'category'],
  'Housing Secretariat': ['Housing Secretariat', 'Housing', 'service_line', 'activity'],
  'Parks, Recreation and Forestry': ['Parks, Recreation & Forestry', 'Parks & rec.', 'service_line', 'activity'],
  'Toronto Public Library': ['Toronto Public Library', 'Library', 'category', 'item'],
};
const shortLabels = {
  'Service And Rent': 'Services & rent',
  'Contribution To Reserves/Reserve Funds': 'Reserve contributions',
  'Inter-Divisional Charges': 'Inter-divisional charges',
  'Full Time Reg Py Sap': 'Full-time regular pay',
  'Benefits To Be Dist': 'Benefits to be distributed',
};
const label = name => shortLabels[name] || name;
const cad = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' });
const pct = value => value > 0 && value < 0.0005 ? '<0.1%' : d3.format('.1%')(value);
const shortCAD = millions => millions >= 1000
  ? '$' + d3.format('.2f')(millions / 1000) + 'B' : '$' + d3.format(',.1f')(millions) + 'M';

// Preserve negative adjustments within itemised receipts. Only the service totals size tiles.
function groupedLines(rows, field) {
  return d3.groups(rows, r => r[field])
    .map(([name, records]) => ({ name, records, cents: d3.sum(records, r => r.cents) }))
    .filter(row => row.cents || row.records.some(r => r.cents))
    .sort((a, b) => d3.descending(a.cents, b.cents) || d3.ascending(a.name, b.name));
}

export async function renderTreemap(selector, data, options = {}) {
  const records = await d3.csv(detailFile, row => row.type === 'Expenses'
    ? { ...row, cents: Math.round(Number(row.signed_cad) * 100) } : null);
  const byService = d3.group(records, r => r.service);
  const services = data.slice().sort((a, b) => b.gross_millions - a.gross_millions).map((row, rank) => {
    const lines = byService.get(row.service);
    const cents = Math.round(row.gross_millions * 1e8);
    if (!lines || d3.sum(lines, r => r.cents) !== cents) throw new Error('Unreconciled budget for ' + row.service);
    const [name, short, first, second] = programs[row.service];
    const purposes = new Map(groupedLines(lines, 'category').map(g => [g.name, g.cents]));
    return { ...row, name, short, first, second, cents, lines, purposes, rank };
  });
  const total = d3.sum(services, s => s.cents);
  const categories = [...new Set(records.map(r => r.category))].sort();
  const per100 = cents => {
    const scaled = 100 * cents / total;
    if (scaled && Math.abs(scaled) < 0.01) return scaled < 0 ? '−(<1¢)' : '<1¢';
    return cad.format(scaled);
  };

  const host = d3.select(selector);
  host.selectAll('*').remove();
  const explorer = host.append('div').attr('class', 'budget-map');
  const toolbar = explorer.append('div').attr('class', 'budget-toolbar');
  const lensLabel = toolbar.append('label').attr('class', 'budget-lens').text('Spending lens ');
  const lensSelect = lensLabel.append('select').attr('aria-label', 'Spending lens');
  const firstLenses = ['Salaries', 'Materials & Supplies', 'Service And Rent'];
  lensSelect.selectAll('option').data([all, ...firstLenses, ...categories.filter(k => !firstLenses.includes(k))])
    .join('option').attr('value', d => d).text(label);
  const views = toolbar.append('div').attr('class', 'budget-switch').attr('role', 'group').attr('aria-label', 'Display');
  const viewButtons = views.selectAll('button').data(['Map', 'Table']).join('button')
    .attr('type', 'button').text(d => d);
  const help = explorer.append('p').attr('class', 'budget-help');
  const map = explorer.append('div').attr('class', 'budget-tiles').attr('role', 'group').attr('aria-label', 'Service budgets');
  const tableBox = explorer.append('div').attr('class', 'budget-table');
  const readout = explorer.append('p').attr('class', 'budget-readout').attr('aria-live', 'polite');
  const receipt = explorer.append('details').attr('class', 'budget-receipt');
  const summary = receipt.append('summary');
  summary.append('span').attr('class', 'budget-tag').text('$100 receipt');
  const receiptTitle = summary.append('strong');
  const receiptTotal = summary.append('b');
  const body = receipt.append('div').attr('class', 'budget-receipt-body');
  const tools = body.append('div').attr('class', 'budget-toolbar');
  const crumbs = tools.append('nav').attr('class', 'budget-crumbs').attr('aria-label', 'Receipt level');
  const units = tools.append('button').attr('class', 'budget-link').attr('type', 'button');
  const items = body.append('div').attr('class', 'budget-items');
  const subtotal = body.append('div').attr('class', 'budget-subtotal');
  body.append('p').attr('class','budget-fine').text('Every line uses the same eight-service total. Displayed amounts are rounded separately.');

  let lens = all;
  let view = 'Map';
  let selected = services.find(s => s.service === 'Toronto Public Library');
  let path = [];
  let actual = false;
  const amount = n => actual ? cad.format(n / 100) : per100(n);
  const valueFor = s => lens === all ? s.cents : s.purposes.get(lens) || 0;

  function inspect(service) {
    readout.text(service
      ? service.name + ' · ' + label(lens) + ' · CAD ' + cad.format(valueFor(service) / 100)
        + ' · ' + per100(valueFor(service)) + ' of the original $100.'
      : 'Pick a service to open its share of a $100 budget.');
  }

  function selectService(service) {
    selected = service;
    path = [];
    receipt.property('open', true);
    renderReceipt();
    drawView();
    inspect(service);
    summary.node().focus({ preventScroll: true });
    receipt.node().scrollIntoView({ block: 'nearest' });
  }

  function setLens(next) {
    lens = next;
    lensSelect.property('value', next);
    path = [];
    drawView();
    renderReceipt();
    inspect(null);
  }

  function renderReceipt() {
    receiptTitle.text(selected.name);
    receiptTotal.text(per100(selected.cents) + ' / $100');
    units.text(actual ? 'Show per $100' : 'Show actual CAD').attr('aria-pressed', actual);
    const active = path.at(-1);
    const first = lens === all ? selected.first : 'category';
    const field = active?.next || first;
    const rows = groupedLines(active?.records || selected.lines, field);
    crumbs.selectAll('*').remove();
    if (path.length) {
      crumbs.append('button').attr('type','button').text('Full receipt').on('click', () => {
        path = []; renderReceipt(); summary.node().focus({ preventScroll: true });
      });
      path.forEach((part, i) => {
        crumbs.append('span').text(' › ');
        if (i === path.length - 1) crumbs.append('span').text(label(part.name));
        else crumbs.append('button').attr('type','button').text(label(part.name)).on('click', () => {
          path = path.slice(0, i + 1); renderReceipt(); summary.node().focus({ preventScroll: true });
        });
      });
    } else crumbs.text(actual ? 'Approved amount · CAD' : 'From the original $100');

    items.selectAll('*').remove();
    items.node().scrollTop = 0;
    for (const row of rows) {
      let next;
      if (lens === all && !path.length) next = selected.second;
      if (lens !== all && field === 'category') {
        next = new Set(row.records.filter(r => r.cents).map(r => r.item)).size > 15 ? 'subcategory' : 'item';
      }
      if (field === 'subcategory') next = 'item';
      if (next === 'activity' && row.records.every(r => r.activity === 'Not assigned')) next = null;
      const entry = items.append(next ? 'button' : 'div').attr('class', 'budget-line')
        .classed('is-lens', field === 'category' && lens === row.name)
        .attr('title', row.name + ' · CAD ' + cad.format(row.cents / 100));
      if (next) entry.attr('type','button').on('click', () => {
        if (lens !== all && field === 'category') {
          lens = row.name; lensSelect.property('value', lens); drawView(); inspect(selected);
        }
        path.push({ ...row, next });
        renderReceipt();
        crumbs.select('button').node().focus({ preventScroll: true });
      });
      entry.append('span').text(label(row.name));
      entry.append('b').text(amount(row.cents));
      entry.append('span').attr('aria-hidden', 'true').text(next ? '›' : '');
    }
    subtotal.text((active ? 'Subtotal' : 'Service total') + '  ' + amount(active ? active.cents : selected.cents));
  }

  function drawMap() {
    const width = map.node().clientWidth, height = map.node().clientHeight;
    if (!width || !height) return;
    const root = d3.hierarchy({ children: services }).sum(d => d.cents || 0);
    const tiles = d3.treemap().size([width, height]).tile(d3.treemapSquarify.ratio(1.15))(root).leaves();
    const buttons = map.selectAll('button').data(tiles, d => d.data.service).join('button')
      .attr('type','button').attr('class','budget-tile')
      .on('click', (_, d) => selectService(d.data))
      .on('pointerenter focus', (_, d) => inspect(d.data)).on('pointerleave blur', () => inspect(null));
    buttons.each(function(d) {
      const s = d.data, w = d.x1 - d.x0, h = d.y1 - d.y0;
      const fraction = valueFor(s) / s.cents;
      const tile = d3.select(this).style('left',d.x0+'px').style('top',d.y0+'px')
        .style('width',w+'px').style('height',h+'px')
        .style('--service-fill',s.rank < 4 ? 'var(' + swatches[s.rank] + ')' : 'var(--card)')
        .classed('top-four',s.rank < 4).classed('has-lens',lens !== all)
        .classed('compact',w < 120 || h < 80).classed('tiny',w < 74 || h < 54)
        .attr('aria-pressed',receipt.property('open') && s === selected)
        .attr('aria-label',s.name + ', rank ' + (s.rank + 1) + ', gross CAD ' + cad.format(s.cents/100)
          + (lens === all ? '' : ', ' + label(lens) + ' ' + pct(fraction)) + '. Open receipt.');
      tile.selectAll('i').data(lens === all ? [] : [fraction]).join('i')
        .attr('aria-hidden','true').style('height',d => 100*d+'%');
      const caption = tile.selectAll('.budget-tile-name').data([s]).join('span').attr('class','budget-tile-name');
      caption.text((s.rank < 4 ? '#' + (s.rank + 1) + ' ' : '') + (w < 174 || h < 70 ? s.short : s.name));
      const value = tile.selectAll('.budget-tile-value').data([s]).join('span').attr('class','budget-tile-value');
      value.selectAll('b').data([s]).join('b').text(lens === all ? shortCAD(s.gross_millions) : pct(fraction));
      value.selectAll('small').data(lens === all ? [] : [s]).join('small').text(d => shortCAD(d.gross_millions) + ' gross');
    });
  }

  function drawTable() {
    tableBox.selectAll('*').remove();
    const table = tableBox.append('table').attr('aria-label','Budget by service');
    const headers = ['Service', 'Gross (CAD M)', lens === all ? 'Per $100' : label(lens) + ' (CAD M)'];
    if (lens !== all) headers.push('Of service');
    table.append('thead').append('tr').selectAll('th').data(headers).join('th').attr('scope','col').text(d => d);
    table.append('tbody').selectAll('tr').data(services).join('tr').each(function(s) {
      const tr = d3.select(this);
      tr.append('td').append('button').attr('type','button').text(s.name).on('click',() => selectService(s));
      tr.append('td').text(d3.format(',.1f')(s.gross_millions));
      tr.append('td').text(lens === all ? per100(s.cents) : d3.format(',.3f')(valueFor(s)/1e8));
      if (lens !== all) tr.append('td').text(pct(valueFor(s) / s.cents));
    });
  }

  function drawView() {
    map.property('hidden',view !== 'Map');
    tableBox.property('hidden',view !== 'Table');
    viewButtons.attr('aria-pressed',d => d === view);
    help.text(lens === all ? 'Tile area shows gross budget in CAD. The four largest services are numbered.'
      : 'Tile area shows gross budget. Hatched fill shows the share for ' + label(lens).toLowerCase() + '.');
    if (view === 'Map') drawMap(); else drawTable();
  }

  lensSelect.on('change', e => setLens(e.target.value));
  viewButtons.on('click', (_, value) => { view = value; drawView(); inspect(null); });
  units.on('click', () => { actual = !actual; renderReceipt(); });
  receipt.on('toggle', () => {
    if (view === 'Map') map.selectAll('button').attr('aria-pressed',d => receipt.property('open') && d.data === selected);
  });
  setLens(all);
  new ResizeObserver(() => { if (view === 'Map') drawMap(); }).observe(map.node());
}
