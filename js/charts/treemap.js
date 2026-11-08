/* TODO (Jacob): replace this stub with the budget treemap (storyboard panel 2, sketch HC1).

   Data
   - Expected file: data/operating_budget_2025.csv
   - Columns: service, gross_millions, revenue_millions, net_millions
   - One row per selected service, 8 rows. Amounts are CAD millions, 2025 approved operating budget.
   - When the file exists, set dataPath for #treemap-chart in the CHARTS list in js/main.js.
     main.js loads the CSV with d3.autoType and passes the rows in as `data`.
   - Only the four-service total (CAD 7.158B), the selected total (CAD 9.766B), and the
     Children's Services and Library figures are confirmed. Use real values for the rest.

   Suggested encoding
   - Area = gross budget. Label = service name + CAD amount.
   - Highlight the four largest: TTC conventional transit, Children's Services,
     Toronto Police Service, Toronto Employment & Social Services.
   - Identify them by label and outline too, not by colour alone.

   CSS variables
   - Four largest: fill var(--peach), var(--rose), var(--teal), var(--lime) with a var(--ink) outline.
   - Other services: fill var(--card), outline var(--ink). Text on any fill: var(--ink).
   - Set colours with .style('fill', 'var(--peach)').

   Rules
   - Draw only inside `selector`. Redraw on resize (ResizeObserver on the container).
   - js/utils/tooltip.js provides a shared tooltip.
*/

import { renderPlaceholder } from '../utils/placeholder.js';

export function renderTreemap(selector, data, options = {}) {
  renderPlaceholder(selector, {
    title: 'Visualization in progress - owner: Jacob',
    text: 'Treemap of the 2025 approved gross operating budget for 8 selected services.',
  });
}
