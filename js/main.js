// Page wiring: loads each chart, reveals sections, runs the progress nav and solution ticks.

import { renderError } from './utils/placeholder.js';

// To connect a chart's data, set its dataPath. CSV and JSON are detected from the extension.
const CHARTS = [
  { selector: '#hook-chart', module: './charts/hook.js', exportName: 'renderHook', dataPath: 'data/hook_summary.json' },
  { selector: '#treemap-chart', module: './charts/treemap.js', exportName: 'renderTreemap', dataPath: null },
  { selector: '#grossnet-chart', module: './charts/grossNet.js', exportName: 'renderGrossNet', dataPath: null },
  { selector: '#library-chart', module: './charts/libraryRates.js', exportName: 'renderLibraryRates', dataPath: null },
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
    chart[exportName](selector, data, options);
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
setUpChecklist();
CHARTS.forEach(loadChart);
