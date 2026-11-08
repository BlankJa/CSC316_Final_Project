// Shared placeholder and error cards. Both replace the contents of a chart container.

// Faint outlines of each future chart. Treemap sizes are illustrative, not data.
const SKELETONS = {
  treemap: `
    <svg class="placeholder__shapes" viewBox="0 0 640 480" preserveAspectRatio="none" aria-hidden="true">
      <rect width="230" height="270"/><rect y="276" width="230" height="204"/>
      <rect x="236" width="190" height="190"/><rect x="236" y="196" width="190" height="144"/>
      <rect x="236" y="346" width="96" height="134"/><rect x="338" y="346" width="88" height="134"/>
      <rect x="432" width="208" height="250"/><rect x="432" y="256" width="208" height="224"/>
    </svg>`,
  slope: `
    <svg class="placeholder__shapes" viewBox="0 0 640 480" aria-hidden="true">
      <rect x="90" y="20" width="110" height="14" rx="4"/><rect x="440" y="20" width="110" height="14" rx="4"/>
      <rect x="60" y="90" width="170" height="74" rx="6"/><rect x="60" y="340" width="170" height="74" rx="6"/>
      <rect x="410" y="90" width="170" height="74" rx="6"/><rect x="410" y="340" width="170" height="74" rx="6"/>
      <line x1="230" y1="127" x2="410" y2="377"/><line x1="230" y1="377" x2="410" y2="127"/>
    </svg>`,
  bars: `
    <svg class="placeholder__shapes" viewBox="0 0 640 480" preserveAspectRatio="none" aria-hidden="true">
      <rect y="84" width="70" height="16" rx="4"/><rect y="214" width="70" height="16" rx="4"/><rect y="344" width="70" height="16" rx="4"/>
      <rect x="92" y="54" width="440" height="76" rx="4"/>
      <rect x="92" y="184" width="427" height="76" rx="4"/>
      <rect x="92" y="314" width="533" height="76" rx="4"/>
      <rect x="86" y="30" width="3" height="420"/>
    </svg>`,
};

function getContainer(selector) {
  const container = document.querySelector(selector);
  if (!container) throw new Error(`No element matches ${selector}`);
  return container;
}

function textEl(tag, className, text) {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  return el;
}

/** renderPlaceholder('#treemap-chart', { label, skeleton: 'treemap' | 'slope' | 'bars' }) */
export function renderPlaceholder(selector, { label, skeleton }) {
  const container = getContainer(selector);
  const card = document.createElement('div');
  card.className = 'placeholder';
  card.innerHTML = SKELETONS[skeleton] ?? '';
  card.append(textEl('p', 'placeholder__label', label));
  container.replaceChildren(card);
}

/** renderError('#hook-chart', 'data/hook_summary.json') shows a friendly message. */
export function renderError(selector, dataPath) {
  const container = getContainer(selector);
  const card = document.createElement('div');
  card.className = 'chart-error';
  card.setAttribute('role', 'status');
  card.append(textEl('p', 'chart-error__title', 'This chart could not be loaded.'));
  card.append(textEl('p', '', dataPath
    ? `Check that ${dataPath} exists and that the page is running on a local server. The rest of the story still works.`
    : 'There was a problem drawing it. The rest of the story still works.'));
  container.replaceChildren(card);
}
