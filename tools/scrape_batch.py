#!/usr/bin/env python3
"""Run the node Overpass scraper for a batch of countries, CONCURRENTLY.
Usage: python tools/scrape_batch.py CODE1,CODE2,... [deadline_seconds] [perCategory]
Each country runs its own `node scrape-runner.js CODE <perCategory>` subprocess in parallel.
Waits up to deadline, then reports which completed (file exists + count).
"""
import sys, os, subprocess, time, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRAPED = os.path.join(ROOT, "data", "sources", "scraped")

def main():
    codes = [c for c in sys.argv[1].split(",") if c.strip()]
    deadline = int(sys.argv[2]) if len(sys.argv) > 2 else 260
    per_cat = sys.argv[3] if len(sys.argv) > 3 else "200"
    os.makedirs(SCRAPED, exist_ok=True)

    procs = {}
    for code in codes:
        logf = open(os.path.join(SCRAPED, f".{code}.log"), "w", encoding="utf-8")
        p = subprocess.Popen(["node", "src/services/scrape-runner.js", code, per_cat],
                             cwd=ROOT, stdout=logf, stderr=subprocess.STDOUT, text=True)
        procs[code] = (p, logf)

    start = time.time()
    done = {}
    for code in codes:
        p, _ = procs[code]
        remaining = deadline - (time.time() - start)
        if remaining <= 0: break
        try:
            p.wait(timeout=remaining); done[code] = True
        except subprocess.TimeoutExpired:
            done[code] = False

    total = 0
    print("code\tstatus\tcount")
    for code in codes:
        f = os.path.join(SCRAPED, f"{code}.json")
        n = 0
        if os.path.exists(f):
            try: n = len(json.load(open(f, encoding="utf-8")).get("businesses", []))
            except Exception: n = -1
        total += n
        status = "OK" if os.path.exists(f) and n > 0 else ("EMPTY" if os.path.exists(f) else "TIMEOUT")
        print(f"{code}\t{status}\t{n}")
    print(f"TOTAL\t\t{total}")
    for code in codes:
        if not (done.get(code) and os.path.exists(os.path.join(SCRAPED, f"{code}.json"))):
            logf = os.path.join(SCRAPED, f".{code}.log")
            if os.path.exists(logf):
                print(f"\n--- {code} log tail ---")
                print(open(logf, encoding="utf-8").read()[-400:])

if __name__ == "__main__":
    main()
