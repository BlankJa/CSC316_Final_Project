// Panel 4. Physical library branches per 10,000 residents for three neighbourhood income groups,
// on one zero-based scale. Hover or keyboard focus reveals the counts behind each rate, including
// the rate when branches closed for renovation are left out.
import { createTooltip } from '../utils/tooltip.js';

const fills = { Lower: '--rose', Middle: '--teal', Higher: '--lime' };
const rate = d3.format('.3f');
const count = d3.format(',');
const income = n => 'CAD ' + count(n);

function range(d) {
  if (d.income_above === null) return '≤ ' + income(d.income_up_to);
  if (d.income_up_to === null) return '> ' + income(d.income_above);
  return income(d.income_above) + '–' + d3.format(',')(d.income_up_to);
}

function details(d) {
  return d.income_group + ' income (' + range(d) + '): ' + count(d.branches) + ' branches for '
    + count(d.population) + ' residents in ' + d.neighbourhoods + ' neighbourhoods, '
    + d.neighbourhoods_without_branch + ' of them with no branch. Open when downloaded: '
    + count(d.branches_open) + ' branches, ' + rate(d.branches_open_per_10k) + ' per 10,000.';
}

export function renderLibraryRates(selector, data, options = {}) {
  const groups = Object.keys(fills).map(name => {
    const row = data.find(d => d.income_group === name);
    const numbers = ['population', 'branches', 'branches_open', 'branches_per_10k', 'branches_open_per_10k'];
    if (!row || !numbers.every(key => Number.isFinite(row[key]))) throw new Error('Missing library figures for ' + name);
    return { ...row, fill: fills[name] };
  });
  const [lower, , higher] = groups;
  const gap = Math.round((higher.branches_per_10k / lower.branches_per_10k - 1) * 100);
  const summary = 'Higher-income neighbourhoods have ' + rate(higher.branches_per_10k)
    + ' physical branches per 10,000 residents, about ' + gap + '% above the lower-income group’s '
    + rate(lower.branches_per_10k) + '.';

  const host = d3.select(selector);
  host.selectAll('*').remove();
  const panel = host.append('div').attr('class', 'library-compare');
  panel.append('p').attr('class', 'library-help')
    .text('Physical branches per 10,000 residents · Click a bar to keep its counts below; click again to clear');
  const plot = panel.append('svg').attr('role', 'group').attr('class', 'library-bars').attr('aria-label', summary);
  const axis = plot.append('g').attr('class', 'library-axis');
  const axisLabel = plot.append('text').attr('class', 'library-axis-label').text('Branches per 10,000 residents');
  const bars = plot.selectAll('g.library-bar').data(groups).join('g')
    .attr('class', 'library-bar').attr('tabindex', 0).attr('role', 'button').attr('aria-pressed', 'false')
    .attr('aria-label', details);
  bars.append('rect').attr('class', 'library-bar-fill').style('fill', d => 'var(' + d.fill + ')');
  const names = bars.append('text').attr('class', 'library-bar-label');
  names.append('tspan').attr('class', 'library-bar-name').text(d => d.income_group + ' income');
  names.append('tspan').attr('class', 'library-bar-range').attr('dy', '1.25em').text(range);
  const values = bars.append('text').attr('class', 'library-bar-value');
  const readout = panel.append('p').attr('class', 'library-readout').attr('aria-live', 'polite').text(summary);

  const tooltip = createTooltip();
  const tip = d => d.income_group + ' income · ' + range(d) + '\n'
    + rate(d.branches_per_10k) + ' per 10,000 (' + count(d.branches) + ' branches)\n'
    + 'Open when downloaded: ' + rate(d.branches_open_per_10k) + ' (' + count(d.branches_open) + ')';
  // Pinned tooltips sit beside their bar instead of following the pointer: right of the value
  // label when that fits inside the card, otherwise under the end of the bar.
  const pin = d => {
    const bar = bars.filter(g => g === d);
    const box = bar.select('.library-bar-fill').node().getBoundingClientRect();
    if (box.bottom < 0 || box.top > window.innerHeight) { tooltip.hide(); return; }
    tooltip.show({ clientX: 0, clientY: 0 }, tip(d));
    const el = [...document.querySelectorAll('.chart-tooltip')].find(node => !node.hidden);
    const label = bar.select('.library-bar-value').node().getBoundingClientRect();
    const card = panel.node().getBoundingClientRect();
    const gap = 8;
    let x = label.right + gap;
    let y = box.top;
    if (x + el.offsetWidth > card.right - gap) {
      x = Math.max(card.left + gap, box.right - el.offsetWidth);
      y = box.bottom + gap;
    }
    el.style.left = x + 'px';
    el.style.top = y + 'px';
  };
  // Hover previews a group with a tooltip that follows the pointer. Click, Enter or Space pins it:
  // the readout keeps its counts and the tooltip stays beside its bar until it is unpinned.
  let pinned = null;
  let hovered = null;
  const show = d => {
    bars.classed('is-active', g => g === d || g === pinned).classed('is-pinned', g => g === pinned)
      .attr('aria-pressed', g => String(g === pinned));
    readout.text(d ? details(d) : summary);
  };
  const placePinned = () => { if (pinned && !hovered) pin(pinned); };
  const preview = (event, d) => {
    hovered = d;
    show(d);
    if (d === pinned || !event) pin(d); else tooltip.show(event, tip(d));
  };
  const restore = () => {
    hovered = null;
    show(pinned);
    if (pinned) pin(pinned); else tooltip.hide();
  };
  const toggle = d => {
    pinned = pinned === d ? null : d;
    show(pinned ?? d);
    if (pinned) pin(pinned);
    else if (!hovered) tooltip.hide();
  };
  // Pressing on another bar blurs the previously clicked one before its click lands; restoring
  // on that blur would briefly flash the old pin, so blur only acts when no bar is under the pointer.
  let pointerOver = false;
  bars.on('pointerenter', (event, d) => { pointerOver = true; preview(event, d); })
    .on('pointerleave', () => { pointerOver = false; restore(); })
    .on('pointermove', (event, d) => { if (d !== pinned) tooltip.move(event); })
    // Mouse clicks also focus the bar; only keyboard focus should preview it.
    .on('focus', function (_, d) { if (this.matches(':focus-visible')) preview(null, d); })
    .on('blur', () => { if (!pointerOver) restore(); })
    .on('click', (_, d) => toggle(d))
    .on('keydown', (event, d) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(d); }
      else if (event.key === 'Escape' && pinned) { pinned = null; show(d); pin(d); }
    });
  window.addEventListener('scroll', placePinned, { passive: true });

  let drawn = false;
  function render() {
    const width = plot.node().clientWidth;
    if (!width) return;
    const narrow = width < 480;
    const left = narrow ? 8 : 150;
    const right = width - (narrow ? 64 : 220);
    const rowHeight = narrow ? 82 : 96;
    const top = 8;
    const height = top + rowHeight * groups.length + 44;
    const x = d3.scaleLinear().domain([0, d3.max(groups, d => d.branches_per_10k)]).nice(5).range([left, right]);
    const y = d3.scaleBand().domain(groups.map(d => d.income_group)).range([top, top + rowHeight * groups.length])
      .paddingInner(narrow ? 0.28 : 0.4);
    const barHeight = narrow ? y.bandwidth() * 0.48 : y.bandwidth();
    const barTop = narrow ? y.bandwidth() - barHeight : 0;
    const baseline = top + rowHeight * groups.length;

    plot.attr('viewBox', [0, 0, width, height]).style('height', height + 'px');
    axis.attr('transform', 'translate(0,' + baseline + ')')
      .call(d3.axisBottom(x).ticks(narrow ? 3 : 5).tickSize(-(baseline - top)).tickPadding(6).tickFormat(d3.format('.2f')));
    axis.select('.domain').remove();
    axisLabel.attr('x', right).attr('y', height - 4).attr('text-anchor', 'end');
    bars.attr('transform', d => 'translate(0,' + y(d.income_group) + ')');
    names.attr('x', narrow ? left : left - 12).attr('y', narrow ? 14 : barHeight / 2 - 4)
      .attr('text-anchor', narrow ? 'start' : 'end');
    names.selectAll('tspan').attr('x', narrow ? left : left - 12);
    if (narrow) names.select('.library-bar-range').attr('dx', '0.5em').attr('dy', 0).attr('x', null);
    else names.select('.library-bar-range').attr('dx', null).attr('dy', '1.25em');

    values.text(d => rate(d.branches_per_10k) + (d === higher && !narrow ? ' · about ' + gap + '% above Lower' : ''));
    const fill = bars.select('.library-bar-fill').attr('x', left).attr('y', barTop).attr('height', barHeight);
    values.attr('y', barTop + barHeight / 2).attr('dy', '0.35em');
    const grow = !drawn && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    drawn = true;
    const end = d => x(d.branches_per_10k);
    if (grow) {
      fill.attr('width', 0).transition().duration(600).attr('width', d => end(d) - left);
      values.attr('x', left + 8).transition().duration(600).attr('x', d => end(d) + 8);
    } else {
      fill.interrupt().attr('width', d => end(d) - left);
      values.interrupt().attr('x', d => end(d) + 8);
    }
    placePinned();
  }

  render();
  new ResizeObserver(() => render()).observe(plot.node());
}
