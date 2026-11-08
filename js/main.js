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

// Light nav text over the dark hero, dark text everywhere else.
function setUpNavTheme() {
  const nav = document.querySelector('.progress');
  const hero = document.querySelector('.hero');
  const observer = new IntersectionObserver(([entry]) => {
    nav.classList.toggle('progress--on-dark', entry.isIntersecting);
  }, { rootMargin: `-${nav.offsetHeight + 1}px 0px 0px 0px` });
  observer.observe(hero);
}

// Moves the hero scan beam. Above the beam the skyline shows as an x-ray wireframe.
// The markup already holds the static half-scanned state used for reduced motion.
function setUpHeroScan() {
  const REST_Y = 430;
  const BOTTOM_Y = 690;
  const FOLLOW_RANGE = 120;
  const DOWN_MS = 2400;
  const BACK_MS = 1000;

  const hero = document.querySelector('.hero');
  const beam = document.getElementById('scan-beam');
  const doneRect = document.getElementById('scan-done-rect');
  const todoRect = document.getElementById('scan-todo-rect');

  function setBeam(y) {
    beam.setAttribute('transform', `translate(0 ${y})`);
    doneRect.setAttribute('height', y);
    todoRect.setAttribute('y', y);
    todoRect.setAttribute('height', 700 - y);
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
  const easeOut = (t) => 1 - (1 - t) ** 3;
  let current = REST_Y;
  let target = REST_Y;
  let followFrame = null;
  let swept = false;

  function follow() {
    current += (target - current) * 0.08;
    setBeam(current);
    followFrame = Math.abs(target - current) > 0.5 ? requestAnimationFrame(follow) : null;
  }

  function requestFollow() {
    if (swept && followFrame === null) followFrame = requestAnimationFrame(follow);
  }

  hero.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    const rect = hero.getBoundingClientRect();
    target = REST_Y + ((event.clientY - rect.top) / rect.height - 0.5) * 2 * FOLLOW_RANGE;
    requestFollow();
  });
  hero.addEventListener('pointerleave', () => {
    target = REST_Y;
    requestFollow();
  });

  const start = performance.now();
  function sweep(now) {
    const elapsed = now - start;
    if (elapsed < DOWN_MS) {
      setBeam(BOTTOM_Y * easeInOut(elapsed / DOWN_MS));
      requestAnimationFrame(sweep);
    } else if (elapsed < DOWN_MS + BACK_MS) {
      setBeam(BOTTOM_Y + (REST_Y - BOTTOM_Y) * easeOut((elapsed - DOWN_MS) / BACK_MS));
      requestAnimationFrame(sweep);
    } else {
      setBeam(REST_Y);
      swept = true;
      requestFollow();
    }
  }
  setBeam(0);
  requestAnimationFrame(sweep);
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
setUpNavTheme();
setUpHeroScan();
setUpChecklist();
CHARTS.forEach(loadChart);
