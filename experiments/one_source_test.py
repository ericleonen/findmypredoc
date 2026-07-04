"""
External smoke test for the findmypredoc package (installed editable, not part
of the package itself). Runs the NBER source end-to-end (fetch -> read ->
extract) and reports success/failure counts broken down by the four read
pathways (website, pdf, docx, google_drive_file) -- confirming the package
works against live postings and surfacing failure modes per pathway.

Uses a cheap Anthropic model instead of the default extractor model, since
this walks every live posting URL and would be expensive at full price.

Writes the full results (per-URL extracted data or error, plus a per-pathway
summary) to results.json alongside this script.
"""

import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from tqdm import tqdm

import pipeline
from sources.predoc import predoc

load_dotenv()

SOURCE = predoc
CHEAP_MODEL = "claude-haiku-4-5"
RESULTS_PATH = Path(__file__).parent / "results.json"


def classify(url: str) -> str:
    lower_url = url.lower()

    is_google_drive_file = (
        "drive.google.com" in lower_url or "docs.google.com" in lower_url
    ) and "/forms/" not in lower_url
    
    if is_google_drive_file:
        return "google_drive_file"
    if lower_url.endswith(".pdf"):
        return "pdf"
    if lower_url.endswith(".docx"):
        return "docx"
    return "website"


def main():
    SOURCE.fetch()
    urls = SOURCE.position_urls
    print(f"Fetched {len(urls)} posting URLs")

    records = []
    summary = defaultdict(lambda: {"success": 0, "failure": 0})

    progress = tqdm(urls, desc="Testing postings", unit="posting", dynamic_ncols=True)
    for url in progress:
        category = classify(url)
        progress.set_description(f"Testing postings [{category}]")
        record = {"url": url, "category": category}

        try:
            text = pipeline.read(url)
            position = pipeline.extract(text, anthropic_model=CHEAP_MODEL, max_tokens=1024)

            record["success"] = True
            record["position"] = position
            summary[category]["success"] += 1
        except Exception as e:
            record["success"] = False
            record["error"] = f"{type(e).__name__}: {e}"
            summary[category]["failure"] += 1

        records.append(record)

        successes = sum(stats["success"] for stats in summary.values())
        failures = sum(stats["failure"] for stats in summary.values())
        progress.set_postfix(ok=successes, fail=failures)

    print("\n=== Results by read pathway ===")
    for category in ("website", "pdf", "docx", "google_drive_file"):
        stats = summary[category]
        total = stats["success"] + stats["failure"]

        if total == 0:
            print(f"{category:>18}: no URLs")
            continue

        print(f"{category:>18}: {stats['success']}/{total} succeeded")
        for record in records:
            if record["category"] == category and not record["success"]:
                print(f"    FAIL {record['url']}\n         {record['error']}")

    output = {
        "run_at": datetime.now(timezone.utc).isoformat(),
        "model": CHEAP_MODEL,
        "summary": summary,
        "results": records,
    }

    with open(RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\nWrote full results to {RESULTS_PATH}")


if __name__ == "__main__":
    main()
