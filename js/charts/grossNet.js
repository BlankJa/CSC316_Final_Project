// Panel 3. Both measures use one zero-based CAD-million scale so the change in rank
// and the size of the revenue offset remain visible when the reader switches lenses.
const compared = [
  { service: "Children's Services", lines: ['Children’s', 'Services'], fill: '--peach' },
  { service: 'Toronto Public Library', lines: ['Toronto Public', 'Library'], fill: '--lime' },
];
const measures = [
  { name: 'Gross budget', key: 'gross_millions' },
  { name: 'Net expenditure', key: 'net_millions' },
];
const amount = n => '$' + d3.format(',.1f')(n) + 'M';

export function renderGrossNet(selector, data, options = {}) {
  const source = new Map(data.map(row => [row.service, row]));
  const services = compared.map(meta => {
    const row = source.get(meta.service);
    if (!row || ![row.gross_millions, row.revenue_millions, row.net_millions].every(Number.isFinite)) {
      throw new Error('Missing budget figures for ' + meta.service);
    }
    return { ...row, ...meta };
  });
  const host = d3.select(selector);
  host.selectAll('*').remove();
  const panel = host.append('div').attr('class', 'budget-compare');
  const toolbar = panel.append('div').attr('class', 'budget-toolbar');
  toolbar.append('strong').text('Budget lens');
  const buttons = toolbar.append('div').attr('class', 'budget-switch')
    .attr('role', 'group').attr('aria-label', 'Comparison measure')
    .selectAll('button').data(measures).join('button').attr('type', 'button').text(d => d.name);
  const help = panel.append('p').attr('class', 'budget-help');
  const plot = panel.append('svg').attr('role', 'img').attr('class', 'budget-bars');
  const description = plot.append('title');
  const axis = plot.append('g').attr('class', 'budget-axis');
  const marks = plot.selectAll('g.budget-bar').data(services).join('g').attr('class', 'budget-bar');
  marks.append('rect').attr('class', 'budget-reference');
  marks.append('rect').attr('class', 'budget-bar-fill').style('fill', d => 'var(' + d.fill + ')');
  marks.append('text').attr('class', 'budget-bar-value').attr('text-anchor', 'middle');
  const names = marks.append('text').attr('class', 'budget-bar-label').attr('text-anchor', 'middle');
  names.selectAll('tspan').data(d => d.lines).join('tspan').attr('x', 0)
    .attr('dy', (_, i) => i === 0 ? 0 : '1.15em').text(d => d);
  const finding = panel.append('p').attr('class', 'budget-finding').attr('aria-live', 'polite');
  let measure = measures[0];

  function render(animate = false) {
    const width = plot.node().clientWidth;
    if (!width) return;
    const height = 345;
    const baseline = height - 55;
    const left = width < 400 ? 46 : 60;
    const right = width - 12;
    const y = d3.scaleLinear().domain([0, d3.max(services, d => d.gross_millions)]).nice(4).range([baseline, 31]);
    const x = d3.scaleBand().domain(services.map(d => d.service)).range([left, right]).padding(0.36);
    const isNet = measure.key === 'net_millions';
    const leader = d3.greatest(services, d => d[measure.key]);
    const other = services.find(d => d !== leader);
    const summary = leader.service + ' ranks first at ' + amount(leader[measure.key]) + ', followed by '
      + other.service + ' at ' + amount(other[measure.key]) + '.';

    buttons.attr('aria-pressed', d => d === measure);
    help.text(isNet ? 'CAD millions · Dashed outlines show the gross budgets before revenues.'
      : 'CAD millions · Approved operating budgets before revenues are deducted.');
    finding.text(summary);
    description.text(measure.name + ' in 2025 Canadian dollars. ' + summary);
    plot.attr('viewBox', [0, 0, width, height]);
    axis.attr('transform', 'translate(' + left + ',0)')
      .call(d3.axisLeft(y).ticks(4).tickSize(-(right-left)).tickPadding(5).tickFormat(d3.format(',')));
    axis.select('.domain').remove();
    marks.attr('transform', d => 'translate(' + (x(d.service) + x.bandwidth()/2) + ',0)');
    marks.select('.budget-reference').attr('display', isNet ? null : 'none')
      .attr('x', -x.bandwidth()/2).attr('width', x.bandwidth())
      .attr('y',d => y(d.gross_millions)).attr('height',d => baseline - y(d.gross_millions));
    const bars = marks.select('.budget-bar-fill').interrupt()
      .attr('x', -x.bandwidth()/2).attr('width',x.bandwidth());
    const values = marks.select('.budget-bar-value').interrupt().text(d => amount(d[measure.key]));
    const move = animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const barUpdate = move ? bars.transition().duration(280) : bars;
    const labelUpdate = move ? values.transition().duration(280) : values;
    barUpdate.attr('y',d => y(d[measure.key])).attr('height',d => baseline - y(d[measure.key]));
    labelUpdate.attr('y',d => y(d[measure.key]) - 9);
    names.attr('y',baseline + 21);
  }

  buttons.on('click', (_, next) => { measure = next; render(true); });
  render();
  new ResizeObserver(() => render()).observe(plot.node());
}
