"""Build data/library_rates.csv for panel 4: physical library branches per 10,000 residents by income group."""
import argparse
import csv
import hashlib
import statistics
from pathlib import Path

from openpyxl import load_workbook

DATA = Path(__file__).resolve().parents[1] / "data"
# Snapshots retrieved 2026-10-18 (Toronto time) from City of Toronto Open Data.
LIBRARY = ("library_branches.csv",
           "https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/f5aa9b07-da35-45e6-b31f-d6790eb9bd9b/"
           "resource/e69b6ebb-8688-4533-8fd9-b63bff1cacdd/download/tpl-branch-general-information-4326.csv",
           "3928bdf9f14c93c81efca8ccf50db939eeb55bf4f665fc2b9f4710366ba104f0")
PROFILES = ("neighbourhood_profiles_2021.xlsx",
            "https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/6e19a90f-971c-46b3-852c-0c48c436d1fc/"
            "resource/19d4a806-7385-4889-acf2-256f1e079060/download/nbhd_2021_census_profile_full_158model.xlsx",
            "9a3c372907e9de09407d847398703146a9cfc0f5b2217446fd61ab8ab35345eb")
# Exact labels in column A of the profile sheet. Population is the 25% sample universe (private households).
NAME_ROW, ID_ROW = "Neighbourhood Name", "Neighbourhood Number"
POPULATION_ROW = "Total - Age groups of the population - 25% sample data"
INCOME_ROW = "Median total income of household in 2020 ($)"
GROUPS = ("Lower", "Middle", "Higher")


def verified(path, sha256):
    if hashlib.sha256(path.read_bytes()).hexdigest() != sha256:
        raise ValueError(f"{path.name} differs from the verified 2026-10-18 snapshot.")
    return path


def read_neighbourhoods(path):
    book = load_workbook(path, read_only=True, data_only=True)
    try:
        rows = {str(r[0]).strip(): r[1:] for r in book.worksheets[0].values if r[0] is not None}
    finally:
        book.close()
    columns = zip(rows[ID_ROW], rows[NAME_ROW], rows[POPULATION_ROW], rows[INCOME_ROW])
    hoods = {int(i): dict(name=n, population=int(p), income=int(m)) for i, n, p, m in columns if i is not None}
    if len(hoods) != 158:
        raise ValueError(f"Expected 158 neighbourhoods, found {len(hoods)}.")
    return hoods


def read_branches(path, hoods):
    with path.open(encoding="utf-8", newline="") as f:
        records = [r for r in csv.DictReader(f) if r["PhysicalBranch"] == "1"]
    if len(records) != 100 or len({r["BranchCode"] for r in records}) != 100:
        raise ValueError("Expected 100 unique physical branches.")
    for r in records:
        hood = hoods.get(int(r["NBHDNo"]))
        if hood is None or hood["name"] != r["NBHDName"].strip():
            raise ValueError(f"Branch {r['BranchCode']} does not match the 158-neighbourhood model.")
    # A branch whose whole Hours field reads "Closed" was shut for renovation when downloaded.
    return [dict(neighbourhood=int(r["NBHDNo"]), open=r["Hours"].strip() != "Closed") for r in records]


def build(hoods, branches):
    # Tertile cut points of the 158 neighbourhood medians; ties at a cut point join the lower group.
    cuts = statistics.quantiles([h["income"] for h in hoods.values()], n=3)
    if cuts != [79000, 90000]:
        raise ValueError(f"Tertile cut points moved to {cuts}; review the published groups.")
    low_cut, high_cut = 79000, 90000

    def group(income):
        return GROUPS[0] if income <= low_cut else GROUPS[1] if income <= high_cut else GROUPS[2]

    counts = {i: [0, 0] for i in hoods}
    for b in branches:
        counts[b["neighbourhood"]][0] += 1
        counts[b["neighbourhood"]][1] += b["open"]
    rows = []
    for name, (low, high) in zip(GROUPS, ((None, low_cut), (low_cut, high_cut), (high_cut, None))):
        members = [i for i, h in hoods.items() if group(h["income"]) == name]
        population = sum(hoods[i]["population"] for i in members)
        total = sum(counts[i][0] for i in members)
        open_now = sum(counts[i][1] for i in members)
        rows.append(dict(
            income_group=name, income_above=low or "", income_up_to=high or "",
            neighbourhoods=len(members),
            neighbourhoods_without_branch=sum(counts[i][0] == 0 for i in members),
            population=population, branches=total, branches_open=open_now,
            branches_per_10k=f"{total / population * 1e4:.6f}",
            branches_open_per_10k=f"{open_now / population * 1e4:.6f}",
        ))
    if sum(r["branches"] for r in rows) != 100 or sum(r["neighbourhoods_without_branch"] for r in rows) != 69:
        raise ValueError("Group totals no longer match 100 branches and 69 neighbourhoods without one.")
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--raw", type=Path, default=DATA / "raw", help="Folder holding the two source snapshots")
    args = parser.parse_args()
    hoods = read_neighbourhoods(verified(args.raw / PROFILES[0], PROFILES[2]))
    branches = read_branches(verified(args.raw / LIBRARY[0], LIBRARY[2]), hoods)
    rows = build(hoods, branches)
    with (DATA / "library_rates.csv").open("w", newline="", encoding="utf-8") as out:
        writer = csv.DictWriter(out, fieldnames=list(rows[0]), lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    closed = sum(not b["open"] for b in branches)
    print(f"Verified {len(branches)} physical branches ({closed} closed) across {len(hoods)} neighbourhoods.")


if __name__ == "__main__":
    main()
