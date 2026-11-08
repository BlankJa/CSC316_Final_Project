// X-ray lens: a magnifier reveals the deeper number under each headline claim.
// Mouse users move the lens. Touch and keyboard users use the Reveal x-ray button.

const ICONS = {
  definitions: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 L19 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><text x="1" y="11" font-size="9" font-weight="700" fill="currentColor">G</text><text x="15" y="22" font-size="9" font-weight="700" fill="currentColor">N</text></svg>',
  population: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 22 C4 11 20 11 20 22 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  location: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22 C5 14 4 11 4 9 A8 8 0 0 1 20 9 C20 11 19 14 12 22 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="9" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
};

const LAYERS = [
  {
    key: 'definitions',
    label: 'Definitions (gross/net)',
    headline: "Gross budget: Children's Services <b>CAD 1,672.5M</b> vs Library <b>CAD 268.9M</b>",
    xray: "Net: Children's Services <b>CAD 94.8M</b> vs Library <b>CAD 247.1M</b> — the ranking reverses.",
  },
  {
    key: 'population',
    label: 'Population (per resident)',
    headline: 'Every income group has library branches',
    xray: 'Per 10,000 residents: Lower <b>0.344</b>, Middle <b>0.334</b>, Higher <b>0.417</b> (about 21% above Lower).',
  },
  {
    key: 'location',
    label: 'Location',
    headline: '<b>100</b> library branches',
    xray: '<b>69 of 158</b> neighbourhoods without a branch inside',
  },
];

function layerMarkup(kind, caption) {
  const cells = LAYERS.map((layer) => `
    <div class="lens__cell lens__cell--${layer.key}">
      <p class="lens__label">${ICONS[layer.key]}${layer.label}</p>
      <p class="lens__statement">${layer[kind]}</p>
    </div>`).join('');
  return `
    <div class="lens__layer lens__layer--${kind}">
      <p class="lens__caption">${caption}</p>
      ${cells}
    </div>`;
}

export function renderLens(selector, data, options = {}) {
  const container = document.querySelector(selector);
  container.innerHTML = `
    <div class="lens">
      <div class="lens__stage">
        ${layerMarkup('headline', 'The headline')}
        ${layerMarkup('xray', 'The x-ray: what is beneath')}
        <div class="lens__ring"></div>
      </div>
      <div class="lens__controls">
        <button class="lens__toggle" type="button" aria-pressed="false">Reveal x-ray</button>
        <p class="lens__hint"></p>
      </div>
    </div>`;

  const lens = container.querySelector('.lens');
  const stage = container.querySelector('.lens__stage');
  const toggle = container.querySelector('.lens__toggle');
  const hint = container.querySelector('.lens__hint');
  const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

  let moved = false;
  let position = { x: 0, y: 0 };
  let frame = null;

  function applyPosition() {
    frame = null;
    stage.style.setProperty('--lens-x', `${position.x}px`);
    stage.style.setProperty('--lens-y', `${position.y}px`);
  }

  function measure() {
    const { width, height } = stage.getBoundingClientRect();
    if (!width) return;
    stage.style.setProperty('--lens-r', `${Math.max(70, Math.min(155, width * 0.165))}px`);
    position = moved
      ? { x: Math.min(position.x, width), y: Math.min(position.y, height) }
      : { x: width / 2, y: height * 0.55 };
    applyPosition();
  }

  function syncInputMode() {
    lens.classList.toggle('lens--mouse', hoverQuery.matches);
    hint.textContent = hoverQuery.matches
      ? 'Move your mouse over the notes to x-ray them.'
      : 'Tap the button to see beneath the headlines.';
  }

  stage.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    const rect = stage.getBoundingClientRect();
    moved = true;
    position = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    if (frame === null) frame = requestAnimationFrame(applyPosition);
  });

  toggle.addEventListener('click', () => {
    const revealed = lens.classList.toggle('is-revealed');
    toggle.setAttribute('aria-pressed', String(revealed));
  });

  hoverQuery.addEventListener('change', syncInputMode);
  new ResizeObserver(measure).observe(stage);
  syncInputMode();
  measure();
}
