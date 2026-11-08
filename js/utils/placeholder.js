// Shared placeholder and error cards. Both replace the contents of a chart container.

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

/** renderPlaceholder('#treemap-chart', { title, text }) */
export function renderPlaceholder(selector, { title, text = '' }) {
  const container = getContainer(selector);
  const card = document.createElement('div');
  card.className = 'placeholder';
  card.innerHTML = '<svg class="placeholder__icon" aria-hidden="true"><use href="#icon-lens"/></svg>';
  card.append(textEl('p', 'placeholder__title', title));
  if (text) card.append(textEl('p', 'placeholder__text', text));
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
