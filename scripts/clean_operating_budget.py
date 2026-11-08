"""Clean Toronto's 2025 approved workbook for the two City X-ray budget charts."""
import argparse
import csv
import hashlib
from collections import Counter, defaultdict
from decimal import Decimal
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.request import urlretrieve

from openpyxl import load_workbook

DATA = Path(__file__).resolve().parents[1] / "data"
FILENAME = "approved-operating-budget-summary-2025.xlsx"
SOURCE = ("https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/"
          "2c90a5d3-5598-4c02-abf2-169456c8f1f1/resource/"
          "f9def3c1-a97f-4d31-bc58-c0494d750b80/download/" + FILENAME)
SHA256 = "690a43b5b192ff960f378a4fbee5fcc59c8b4dffade42e43253d6fa7088f448f"
# Published gross controls in thousands of CAD, Budget Summary Appendix 1.1.2.
CONTROLS = {
    "Toronto Transit Commission - Conventional": 2636123,
    "Children's Services": 1672474,
    "Toronto Police Service": 1481478,
    "Toronto Employment and Social Services": 1367543,
    "Toronto Shelter and Support Services": 898767,
    "Housing Secretariat": 840420,
    "Parks, Recreation and Forestry": 599836,
    "Toronto Public Library": 268903,
}
HEADERS = ("Program", "Service", "Activity", "Expense/Revenue", "Category Name",
           "Sub-Category Name", "Commitment item", "2025")
FIELDS = ("service", "service_line", "activity", "type", "category", "subcategory", "item")
MILLION = Decimal(10**6)


def clean(workbook):
    if hashlib.sha256(workbook.read_bytes()).hexdigest() != SHA256:
        raise ValueError("Workbook differs from the verified 2025 source snapshot.")
    book = load_workbook(workbook, read_only=True, data_only=True)
    totals = defaultdict(Counter)
    lines = []
    try:
        records = iter(book["Open Data"].values)
        if tuple(next(records)[:8]) != HEADERS:
            raise ValueError("Unexpected 2025 worksheet headers.")
        for number, record in enumerate(records, start=2):
            fields = dict(zip(FIELDS, (" ".join(str(v or "").split()) for v in record[:7])))
            if fields["service"] not in CONTROLS:
                continue
            if not all(fields.values()) or fields["type"] not in ("Expenses", "Revenues"):
                raise ValueError(f"Unexpected source labels at row {number}.")
            value = Decimal(str(record[7]))
            if not value.is_finite() or value != value.quantize(Decimal(".01")):
                raise ValueError(f"Invalid CAD amount at row {number}.")
            lines.append(dict(source_row=number, **fields, signed_cad=f"{value:.2f}"))
            totals[fields["service"]][fields["type"]] += value
    finally:
        book.close()

    summary = []
    for service, control in CONTROLS.items():
        group = totals[service]
        if set(group) != {"Expenses", "Revenues"} or abs(group["Expenses"] - control * 1000) > 500:
            raise ValueError(f"{service} failed the published gross or coverage check.")
        gross = group["Expenses"] / MILLION
        # Revenues in the workbook are signed credits. Preserve signed offsets within each type.
        revenue = -group["Revenues"] / MILLION
        summary.append(dict(service=service, gross_millions=f"{gross:.8f}",
                            revenue_millions=f"{revenue:.8f}", net_millions=f"{gross-revenue:.8f}"))
    return lines, summary


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", nargs="?", type=Path, default=DATA / "raw" / FILENAME)
    parser.add_argument("--download", action="store_true", help="Download the pinned workbook to data/raw/")
    args = parser.parse_args()
    if args.download:
        args.source.parent.mkdir(parents=True, exist_ok=True)
        with TemporaryDirectory(dir=args.source.parent) as tmp:
            copy = Path(tmp) / FILENAME
            urlretrieve(SOURCE, copy)
            lines, summary = clean(copy)
            copy.replace(args.source)
    else:
        lines, summary = clean(args.source)

    for name, rows in [("operating_budget_2025.csv", summary), ("operating_budget_2025_lines.csv", lines)]:
        with (DATA / name).open("w", newline="", encoding="utf-8") as out:
            writer = csv.DictWriter(out, fieldnames=list(rows[0]), lineterminator="\n")
            writer.writeheader()
            writer.writerows(rows)
    print(f"Verified {len(summary)} services from {len(lines):,} signed source rows.")


if __name__ == "__main__":
    main()
