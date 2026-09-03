# PromQL drills

Run every one of these against the lab (`http://localhost:9090/graph`). The
answers are hidden behind a `<details>` block — **write the query first, then
open it.** Reading the answer without attempting it is how I fool myself into
thinking I know PromQL.

| Set | Topic | Do it in week |
|---|---|---|
| [01](01-selectors.md) | Selectors, matchers, ranges, offsets | 1 |
| [02](02-rates-and-counters.md) | `rate` / `irate` / `increase`, gauges | 2 |
| [03](03-aggregation-and-matching.md) | `by` / `without`, vector matching, joins | 2 |
| [04](04-histograms-and-slo.md) | Histograms, quantiles, SLO ratios, subqueries | 2 |

Scoring: mark each one ✅ (right first try), 🟡 (right after a hint), ❌ (wrong).
Re-do every 🟡 and ❌ two days later. Track it in `progress/log.md`.
