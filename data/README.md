# Data files

Cleaned files used by the site go in this folder. Large raw downloads go in `data/raw/`, which git ignores.

Connect a new file by setting `dataPath` for its chart in the `CHARTS` list in `js/main.js`. `.csv` files load through `d3.csv` with `d3.autoType`; everything else loads as JSON.

| File | Status | Used by | Owner |
|---|---|---|---|
| `hook_summary.json` | Present | `js/charts/hook.js` | Connie |
| `operating_budget_2025.csv` | Present | `js/charts/treemap.js`, `js/charts/grossNet.js` | Jacob |
| `operating_budget_2025_lines.csv` | Present | Treemap lenses and itemised receipts | Jacob |
| `library_rates.csv` | To add (proposed name) | `js/charts/libraryRates.js` | Ken |

`js/charts/lens.js` keeps its short text as a constant at the top of the file. It loads no data file.

## hook_summary.json

| Field | Meaning | Value |
|---|---|---|
| `neighbourhoods` | Toronto neighbourhoods (count) | 158 |
| `without_branch` | Neighbourhoods with no physical branch inside their boundaries (count) | 69 |
| `branches` | Physical Toronto Public Library branches (count) | 100 |

The hook does not use per-neighbourhood data. Dot order is arbitrary and identifies no specific place.

## operating_budget_2025.csv

One row per selected service, 8 rows. Year: 2025 approved operating budget.

| Column | Type | Units |
|---|---|---|
| `service` | text | service name |
| `gross_millions` | number | CAD millions |
| `revenue_millions` | number | CAD millions (budgeted revenues) |
| `net_millions` | number | CAD millions (gross minus budgeted revenues) |

Budget checks from the source workbook

| Item | Value |
|---|---|
| Children's Services | gross 1,672.5; net 94.8 |
| Toronto Public Library | gross 268.9; net 247.1 |
| Four largest selected services, combined gross | CAD 7.158B (73.3% of selected total) |
| Eight selected services, combined gross | CAD 9.766B |

The eight gross totals match the published gross expenditures at the report’s precision of CAD thousands. [City of Toronto 2025 Budget Summary, Appendix 1.1.2](https://www.toronto.ca/wp-content/uploads/2025/05/96a6-2025-City-of-Toronto-Budget-Summary.pdf)

## operating_budget_2025_lines.csv

The two CSVs come from the same 2025 approved workbook. The detail file retains 3,566 expense rows and 296 revenue rows for the eight selected programs. `source_row` points to the original Excel row in the `Open Data` worksheet. `service` is the workbook’s Program, and `service_line`, `activity`, `category`, `subcategory` and `item` retain its spending classifications. `type` distinguishes Expenses and Revenues. `signed_cad` is the workbook amount in CAD, including zero values and negative adjustments.

For each program, gross is the sum of expense rows. Budgeted revenue is the negated sum of signed revenue rows. Net is gross minus this revenue. The summary divides these CAD values by 1,000,000. The receipt scales each expense subtotal to the same eight-service gross total and rounds each displayed line separately. [Official 2025 workbook](https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/2c90a5d3-5598-4c02-abf2-169456c8f1f1/resource/f9def3c1-a97f-4d31-bc58-c0494d750b80/download/approved-operating-budget-summary-2025.xlsx)

To rebuild from the group site’s root, use Python with `openpyxl` 3.1.5 and run `python3 scripts/clean_operating_budget.py --download`. The script verifies the original file’s SHA-256 and checks all eight published gross totals. Later runs can reuse the workbook in `data/raw/` with `python3 scripts/clean_operating_budget.py`.

## library_rates.csv

Proposed structure; Ken can change it and update this section.

| Column | Type | Units |
|---|---|---|
| `income_group` | text | Lower, Middle, Higher |
| `income_range` | text | Lower: at most CAD 79,000. Middle: CAD 79,000-90,000. Higher: over CAD 90,000 |
| `branches_per_10k` | number | physical branches per 10,000 residents |

Income is 2020 median household income. Population is from the 2021 Census. Values: Lower 0.344, Middle 0.334, Higher 0.417.

## Sources

All from [City of Toronto Open Data](https://open.toronto.ca/).

| Data | Years | Link |
|---|---|---|
| Operating budget | 2025 approved | [Budget - Operating Budget Program Summary by Expenditure Category](https://open.toronto.ca/dataset/budget-operating-budget-program-summary-by-expenditure-category/) |
| Library branch inventory | Downloaded October 2026 | [Library Branch General Information](https://open.toronto.ca/dataset/library-branch-general-information/) |
| Neighbourhood Profiles | 2021 Census population, 2020 household income | [Neighbourhood Profiles](https://open.toronto.ca/dataset/neighbourhood-profiles/) |

TODO (team): these three pages exist in the Open Data catalogue, matched by name. Confirm each is the dataset you actually downloaded. The catalogue also lists "Toronto Public Library Branch Locations", so check the library link in particular.

## Limitations

- Approved budgets are not actual spending.
- The data is a mixed-year snapshot.
- Results are associations, not causes.
- Neighbourhood boundaries are not library service areas.
