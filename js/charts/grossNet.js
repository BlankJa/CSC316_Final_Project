/* TODO (Jacob): replace this stub with the gross vs net comparison (storyboard panel 3).

   Data
   - Expected file: data/operating_budget_2025.csv (shared with treemap.js)
   - Columns: service, gross_millions, revenue_millions, net_millions
   - One row per selected service, 8 rows. Amounts are CAD millions, 2025 approved operating budget.
   - Use the rows for Children's Services and Toronto Public Library.
   - When the file exists, set dataPath for #grossnet-chart in the CHARTS list in js/main.js.
   - Confirmed values to check against:
       Children's Services: gross 1672.5, net 94.8
       Toronto Public Library: gross 268.9, net 247.1

   Suggested encoding
   - Two-column slope, or side-by-side bars, showing the ranking reversal.
   - Add a toggle between gross and net. Make it a real <button> with aria-pressed.
   - Label both services directly with their CAD amounts, so colour is not the only signal.

   CSS variables
   - Children's Services: var(--peach). Toronto Public Library: var(--lime).
   - Outlines and text: var(--ink). Emphasis: var(--accent).
   - Set colours with .style('fill', 'var(--peach)').

   Rules
   - Draw only inside `selector`. Redraw on resize (ResizeObserver on the container).
   - Check window.matchMedia('(prefers-reduced-motion: reduce)') before animating.
*/

import { renderPlaceholder } from '../utils/placeholder.js';

export function renderGrossNet(selector, data, options = {}) {
  renderPlaceholder(selector, {
    label: 'In development · owner: Jacob',
    skeleton: 'slope',
  });
}
