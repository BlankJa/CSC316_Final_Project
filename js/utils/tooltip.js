// Shared tooltip for any chart.
//
//   import { createTooltip } from '../utils/tooltip.js';
//   const tooltip = createTooltip();
//   marks
//     .on('pointerenter', (event, d) => tooltip.show(event, `${d.service}\nCAD ${d.gross_millions}M`))
//     .on('pointermove', (event) => tooltip.move(event))
//     .on('pointerleave', () => tooltip.hide());
//
// Text is set with textContent, and \n starts a new line. Tooltips repeat information
// for mouse users, so anything essential must also appear as a label or in the page text.

const OFFSET = 14;
const EDGE = 8;

export function createTooltip() {
  const el = document.createElement('div');
  el.className = 'chart-tooltip';
  el.hidden = true;
  document.body.append(el);

  function move(event) {
    const { width, height } = el.getBoundingClientRect();
    let x = event.clientX + OFFSET;
    let y = event.clientY + OFFSET;
    if (x + width > window.innerWidth - EDGE) x = event.clientX - width - OFFSET;
    if (y + height > window.innerHeight - EDGE) y = event.clientY - height - OFFSET;
    el.style.left = `${Math.max(EDGE, x)}px`;
    el.style.top = `${Math.max(EDGE, y)}px`;
  }

  return {
    show(event, text) {
      el.textContent = text;
      el.hidden = false;
      move(event);
    },
    move,
    hide() {
      el.hidden = true;
    },
    destroy() {
      el.remove();
    },
  };
}
