// Hook: 158 schematic dots, 69 of which fade to hollow as a counter climbs.
// The dots are not a map and dot order is arbitrary: no dot stands for a real neighbourhood.

const CELL_TARGET = 44;
const CELL_MAX = 46;
const MIN_COLUMNS = 14;
const MAX_COLUMNS = 20;
const HOLD_MS = 500;
const SPREAD_MS = 2200;
const FADE_MS = 350;

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function renderHook(selector, data, options = {}) {
  const { neighbourhoods: total, without_branch: without, branches } = data;
  if (!(total > 0) || !(without >= 0) || without > total || !(branches > 0)) {
    throw new Error('hook_summary.json has missing or inconsistent values');
  }

  const withBranch = total - without;
  const percent = (count) => `${((count / total) * 100).toFixed(1)}%`;

  const container = d3.select(selector);
  container.selectAll('*').remove();

  const root = container.append('div').attr('class', 'hook');

  const stats = root.append('div').attr('class', 'hook__stats');
  const countStat = stats.append('p').attr('class', 'stat stat--surprise stat--highlight');
  const countText = countStat.append('span').attr('class', 'hook__num');
  countStat.append('span').attr('class', 'stat__label')
    .text(`of ${total} neighbourhoods have no physical library branch inside their boundaries`);
  const percentStat = stats.append('p').attr('class', 'stat');
  const percentText = percentStat.append('span').attr('class', 'hook__num');
  percentStat.append('span').attr('class', 'stat__label').text('of all neighbourhoods');
  const branchStat = stats.append('p').attr('class', 'stat');
  branchStat.append('span').attr('class', 'hook__num').text(branches);
  branchStat.append('span').attr('class', 'stat__label').text('library branches');

  const gridColumn = root.append('div').attr('class', 'hook__grid');
  const svg = gridColumn.append('svg')
    .attr('role', 'img')
    .attr('aria-label', `Schematic of ${total} dots, one per neighbourhood. ${withBranch} are filled and ${without} are hollow: ${percent(without)} of neighbourhoods have no branch inside their boundaries.`);

  const footer = root.append('div').attr('class', 'hook__footer');
  const key = footer.append('div');

  const replay = footer.append('button')
    .attr('class', 'hook__replay')
    .attr('type', 'button')
    .text('Replay')
    .property('hidden', prefersReducedMotion());

  key.append('p').attr('class', 'hook__schematic')
    .text('Schematic - each dot is one neighbourhood, not drawn to location');

  const legend = key.append('p').attr('class', 'hook__legend');
  legend.append('span').html(`<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" style="fill:var(--lake);stroke:var(--lake);stroke-width:1.5"/></svg>${withBranch} with a branch inside`);
  legend.append('span').html(`<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" style="fill:none;stroke:var(--brick);stroke-width:1.5"/></svg>${without} without a branch inside`);

  key.append('p').attr('class', 'hook__order')
    .text('Dot order is arbitrary. A dot does not identify a specific neighbourhood.');

  const dots = svg.selectAll('circle')
    .data(d3.range(total))
    .join('circle')
    .style('fill', 'var(--lake)')
    .style('stroke-width', 1.5);

  const hollowDots = dots.filter((d) => d >= withBranch);

  // D3 cannot interpolate var(), so the stroke transition uses the resolved colours.
  const rootStyle = getComputedStyle(document.documentElement);
  const lake = rootStyle.getPropertyValue('--lake').trim();
  const brick = rootStyle.getPropertyValue('--brick').trim();

  function layout() {
    const width = gridColumn.node().clientWidth;
    if (!width) return;
    const columns = Math.max(MIN_COLUMNS, Math.min(MAX_COLUMNS, Math.floor(width / CELL_TARGET)));
    const cell = Math.min(CELL_MAX, width / columns);
    const rows = Math.ceil(total / columns);
    svg.attr('width', columns * cell).attr('height', rows * cell);
    dots
      .attr('cx', (d) => (d % columns) * cell + cell / 2)
      .attr('cy', (d) => Math.floor(d / columns) * cell + cell / 2)
      .attr('r', cell * 0.34);
  }

  function setCount(count) {
    countText.text(count);
    percentText.text(percent(count));
  }

  function stop() {
    dots.interrupt();
    stats.interrupt();
  }

  function showFinal() {
    stop();
    dots
      .style('fill-opacity', (d) => (d >= withBranch ? 0 : 1))
      .style('stroke', (d) => (d >= withBranch ? brick : lake));
    setCount(without);
  }

  function showLit() {
    stop();
    dots.style('fill-opacity', 1).style('stroke', lake);
    setCount(0);
  }

  function play() {
    if (prefersReducedMotion()) {
      showFinal();
      return;
    }
    showLit();
    const steps = Math.max(1, without - 1);
    hollowDots.transition()
      .delay((d) => HOLD_MS + ((d - withBranch) / steps) * SPREAD_MS)
      .duration(FADE_MS)
      .style('fill-opacity', 0)
      .style('stroke', brick);
    stats.transition()
      .delay(HOLD_MS)
      .duration(SPREAD_MS + FADE_MS)
      .ease(d3.easeLinear)
      .tween('count', () => (t) => setCount(Math.round(t * without)));
  }

  layout();
  new ResizeObserver(layout).observe(gridColumn.node());
  replay.on('click', play);

  if (prefersReducedMotion()) {
    showFinal();
    return;
  }

  showLit();
  // Start once most of the grid is on screen, even if the viewport is shorter than the grid.
  const startThreshold = Math.min(0.75, (window.innerHeight * 0.7) / svg.node().getBoundingClientRect().height);
  const startObserver = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    startObserver.disconnect();
    play();
  }, { threshold: startThreshold });
  startObserver.observe(svg.node());
}
