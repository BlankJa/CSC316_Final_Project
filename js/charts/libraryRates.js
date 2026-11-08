/* TODO (Ken): not developed yet (storyboard panel 4).

   Data (proposed, change it if your cleaned file differs, and update data/README.md)
   - data/library_rates.csv
   - Columns: income_group, income_range, branches_per_10k
   - 3 rows: Lower 0.344, Middle 0.334, Higher 0.417 (physical branches per 10,000 residents).
   - When the file exists, set dataPath for #library-chart in the CHARTS list in js/main.js.

   Suggested encoding (from the storyboard)
   - Horizontal bars, zero baseline, x-axis "Branches per 10,000 residents".
   - Label each bar with group and value. Annotate Higher as about 21% above Lower.

   CSS variables
   - Lower: var(--rose). Middle: var(--teal). Higher: var(--lime). Outlines and text: var(--ink).

   Rules
   - Draw only inside `selector`. Redraw on resize (ResizeObserver on the container).
*/

import { renderPlaceholder } from '../utils/placeholder.js';

export function renderLibraryRates(selector, data, options = {}) {
  renderPlaceholder(selector, {
    label: 'In development · owner: Ken',
    skeleton: 'bars',
  });
}
