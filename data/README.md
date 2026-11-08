# Data files

Cleaned files used by the site go in this folder. Large raw downloads go in `data/raw/`, which git ignores.

Connect a new file by setting `dataPath` for its chart in the `CHARTS` list in `js/main.js`. `.csv` files load through `d3.csv` with `d3.autoType`; everything else loads as JSON.

| File | Status | Used by | Owner |
|---|---|---|---|
| `hook_summary.json` | Present | `js/charts/hook.js` | Connie |
| `operating_budget_2025.csv` | Present | `js/charts/treemap.js`, `js/charts/grossNet.js` | Jacob |
| `operating_budget_2025_lines.csv` | Present | Treemap lenses and itemised receipts | Jacob |
| `library_rates.csv` | Present | `js/charts/libraryRates.js` | Ken |

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

One row per neighbourhood income group, 3 rows.

| Column | Type | Units |
|---|---|---|
| `income_group` | text | Lower, Middle, Higher |
| `income_above`, `income_up_to` | number or empty | CAD, 2020 median household income; a group holds neighbourhoods with income above `income_above` and at most `income_up_to` |
| `neighbourhoods` | number | neighbourhoods in the group |
| `neighbourhoods_without_branch` | number | neighbourhoods with no physical branch inside their boundaries |
| `population` | number | 2021 Census people in private households (25% sample data) |
| `branches`, `branches_open` | number | physical branches; those open when the inventory was downloaded |
| `branches_per_10k`, `branches_open_per_10k` | number | branches per 10,000 residents |

| Group | Income | Neighbourhoods | Branches (open) | Per 10,000 (open only) |
|---|---|---|---|---|
| Lower | at most CAD 79,000 | 54 | 35 (32) | 0.344 (0.314) |
| Middle | CAD 79,000-90,000 | 52 | 31 (28) | 0.334 (0.302) |
| Higher | over CAD 90,000 | 52 | 34 (34) | 0.417 (0.417) |

Branches are the 100 inventory records with `PhysicalBranch = 1`, joined to the 158-neighbourhood model by `NBHDNo`; every branch's neighbourhood name matches. The cut points are the tertiles of the 158 neighbourhood medians; neighbourhoods exactly at a cut point (4 at CAD 79,000 and 7 at CAD 90,000) join the lower group, which is why the groups are not equal. Using `<` instead of `<=` would give 0.365, 0.289 and 0.425, so the boundary rule must stay as published. Each rate is the group's summed branches divided by its summed population, times 10,000.

Six branches have the whole `Hours` field set to `Closed`: Centennial, Dawes Road, Flemingdon Park, Junction Triangle, Pleasant View and Woodside Square. Centennial, Dawes Road, Pleasant View and Woodside Square are listed on [TPL's renovation page](https://tpl.ca/about-the-library/renovations/). The main figures keep all 100 branches because the measure describes branch provision, not opening on a given day. The `_open` columns show how much the comparison depends on that choice.

To rebuild from the group site's root, put the two snapshots in `data/raw/` as `library_branches.csv` ([Library Branch General Information](https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/f5aa9b07-da35-45e6-b31f-d6790eb9bd9b/resource/e69b6ebb-8688-4533-8fd9-b63bff1cacdd/download/tpl-branch-general-information-4326.csv)) and `neighbourhood_profiles_2021.xlsx` ([Neighbourhood Profiles, 158 model](https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/6e19a90f-971c-46b3-852c-0c48c436d1fc/resource/19d4a806-7385-4889-acf2-256f1e079060/download/nbhd_2021_census_profile_full_158model.xlsx)), then run `python3 scripts/clean_library_rates.py` with `openpyxl` 3.1.5. The script checks both files' SHA-256 against the 18 October 2026 snapshots. The library inventory is updated in place, so a fresh download will fail that check until the script and figures are reviewed.

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
