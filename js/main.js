// Page wiring: loads each chart, reveals sections, runs the progress nav and solution ticks.

import { renderError } from './utils/placeholder.js';

// To connect a chart's data, set its dataPath. CSV and JSON are detected from the extension.
const CHARTS = [
  { selector: '#hook-chart', module: './charts/hook.js', exportName: 'renderHook', dataPath: 'data/hook_summary.json' },
  { selector: '#treemap-chart', module: './charts/treemap.js', exportName: 'renderTreemap', dataPath: 'data/operating_budget_2025.csv' },
  { selector: '#grossnet-chart', module: './charts/grossNet.js', exportName: 'renderGrossNet', dataPath: 'data/operating_budget_2025.csv' },
  { selector: '#library-chart', module: './charts/libraryRates.js', exportName: 'renderLibraryRates', dataPath: 'data/library_rates.csv' },
  { selector: '#lens-chart', module: './charts/lens.js', exportName: 'renderLens', dataPath: null },
];

function loadData(path) {
  if (!path) return Promise.resolve(null);
  return path.endsWith('.csv') ? d3.csv(path, d3.autoType) : d3.json(path);
}

// Each chart loads on its own, so a bug in one file cannot break the others.
async function loadChart({ selector, module, exportName, dataPath, options = {} }) {
  try {
    const [chart, data] = await Promise.all([import(module), loadData(dataPath)]);
    await chart[exportName](selector, data, options);
  } catch (error) {
    console.error(`Could not render ${selector}:`, error);
    renderError(selector, window.d3 ? dataPath : null);
  }
}

function setUpReveals() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
}

function setUpProgressNav() {
  const links = [...document.querySelectorAll('.progress__list a')];
  const currentLabel = document.querySelector('.progress__current');
  const sections = [...document.querySelectorAll('[data-stage]')];
  const titleScreen = document.querySelector('[data-stage-none]');

  function setCurrent(sectionId, stageName) {
    const currentIndex = links.findIndex((link) => link.dataset.target === sectionId);
    links.forEach((link, index) => {
      link.classList.toggle('is-past', currentIndex > -1 && index < currentIndex);
      if (index === currentIndex) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });
    currentLabel.textContent = stageName;
  }

  // A thin band at mid-screen decides which section is current.
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      if (entry.target === titleScreen) setCurrent(null, '');
      else setCurrent(entry.target.id, entry.target.dataset.stage);
    });
  }, { rootMargin: '-45% 0px -54% 0px' });

  [titleScreen, ...sections].forEach((el) => observer.observe(el));
}

// Moves the hero magnifier with the mouse. The markup holds its resting position over
// the CN Tower, which is what touch, reduced-motion and no-JS visitors see.
function setUpHeroLens() {
  const ZOOM = 1.5;
  const MIN_Y = 150;
  const MAX_Y = 640;

  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canHover || reduceMotion) return;

  const hero = document.querySelector('.hero');
  const svg = document.getElementById('hero-skyline');
  const lens = document.getElementById('hero-lens');
  const clip = document.getElementById('hero-lens-clip-circle');
  const zoom = document.getElementById('hero-lens-zoom');
  let point = null;
  let frame = null;

  function applyPosition() {
    frame = null;
    const { x, y } = point;
    lens.setAttribute('transform', `translate(${x} ${y})`);
    clip.setAttribute('cx', x);
    clip.setAttribute('cy', y);
    zoom.setAttribute('transform', `translate(${x} ${y}) scale(${ZOOM}) translate(${-x} ${-y})`);
  }

  hero.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM().inverse());
    point = { x: p.x, y: Math.min(MAX_Y, Math.max(MIN_Y, p.y)) };
    if (frame === null) frame = requestAnimationFrame(applyPosition);
  });
}

function setUpChecklist() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.querySelector('input').checked = true;
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.6 });

  document.querySelectorAll('.check-card').forEach((card) => {
    observer.observe(card);
    // Once someone clicks a card, scrolling must not change their choice.
    card.querySelector('input').addEventListener('change', () => observer.unobserve(card));
  });
}

setUpReveals();
setUpProgressNav();
setUpHeroLens();
setUpChecklist();
CHARTS.forEach(loadChart);
