"""Verify every project credited in the Open Source Atlas still exists.

Usage:
    python scripts/check_credits.py              # unauthenticated (60 requests/hour)
    GITHUB_TOKEN=... python scripts/check_credits.py

Reads frontend/src/data/credits.json, asks the GitHub API about each repository
and prints status, licence and stars. Exits non-zero if a repository is missing
or has moved, so it can run in CI. Network access to api.github.com is required.
"""
import json
import os
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "frontend" / "src" / "data" / "credits.json"


def check(item):
    req = urllib.request.Request(
        f"https://api.github.com/repos/{item['repo']}",
        headers={"Accept": "application/vnd.github+json", "User-Agent": "origlyph-credits-check"},
    )
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            data = json.load(res)
    except urllib.error.HTTPError as err:
        return item, "MISSING" if err.code == 404 else f"HTTP {err.code}", None
    except Exception as err:  # network failure
        return item, f"ERROR {err}", None
    canonical = data.get("full_name", "")
    status = "ok" if canonical.lower() == item["repo"].lower() else f"MOVED -> {canonical}"
    lic = (data.get("license") or {}).get("spdx_id") or "n/a"
    return item, status, f"{lic:<14} {data.get('stargazers_count', 0):>7,} stars"


def main():
    items = json.loads(DATA.read_text())
    with ThreadPoolExecutor(8) as pool:
        results = list(pool.map(check, items))
    bad = 0
    for item, status, info in results:
        print(f"{item['repo']:<48} {status:<28} {info or ''}")
        if status != "ok":
            bad += 1
    print(f"\n{len(items) - bad}/{len(items)} credits verified")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
