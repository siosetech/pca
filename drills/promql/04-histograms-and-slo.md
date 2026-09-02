# Drill 04 — Histograms, quantiles, SLOs, subqueries

The sample app's histogram is `app_request_duration_seconds`, with buckets
straddling 300 ms. Look at the raw output first:
`curl http://localhost:8000/metrics | grep duration`

### 1. What three series does a histogram produce?
<details><summary>Answer</summary>

`_bucket{le="..."}` (cumulative counts, always including `le="+Inf"`), `_sum`
(total of all observations) and `_count` (number of observations, equal to the
`+Inf` bucket).
</details>

### 2. p95 request latency, across the whole app.
<details><summary>Answer</summary>

```promql
histogram_quantile(0.95, sum by (le) (rate(app_request_duration_seconds_bucket[5m])))
```
Two non-negotiables: **`rate()` the buckets first**, and **keep `le`** in the
aggregation. Drop either and you get nonsense or `NaN`.
</details>

### 3. p99 latency per route.
<details><summary>Answer</summary>

```promql
histogram_quantile(0.99, sum by (le, route) (rate(app_request_duration_seconds_bucket[5m])))
```
`/api/slow` should tower over the others.
</details>

### 4. What happens if you forget `by (le)`?
<details><summary>Answer</summary>

`sum(rate(..._bucket[5m]))` collapses every bucket into one series and destroys
`le`. `histogram_quantile` has nothing to interpolate between and returns `NaN`.
Do it once on purpose so the error is familiar.
</details>

### 5. Average request duration.
<details><summary>Answer</summary>

```promql
rate(app_request_duration_seconds_sum[5m])
  / rate(app_request_duration_seconds_count[5m])
```
Divide two **rates**, not two raw counters — the raw ratio would give you the
all-time average, not the recent one.
</details>

### 6. SLO: what fraction of requests completed in under 300 ms?
<details><summary>Answer</summary>

```promql
sum(rate(app_request_duration_seconds_bucket{le="0.3"}[5m]))
  / sum(rate(app_request_duration_seconds_count[5m]))
```
This works only because a `le="0.3"` bucket exists. **Pick buckets around your
SLO threshold** — that's the whole reason bucket choice matters.
</details>

### 7. Same thing as an error budget burn: fraction of requests *slower* than 300 ms.
<details><summary>Answer</summary>

```promql
1 - (
  sum(rate(app_request_duration_seconds_bucket{le="0.3"}[5m]))
  / sum(rate(app_request_duration_seconds_count[5m]))
)
```
</details>

### 8. Why can't I do this with the summary metric `app_response_size_bytes`?
<details><summary>Answer</summary>

A summary's quantiles are computed **in the client**, per instance, over a
sliding window. `avg(app_response_size_bytes{quantile="0.99"})` across ten pods
is mathematically meaningless — the average of ten p99s is not the p99. You can
still aggregate its `_sum` and `_count` for an average, just not its quantiles.
**That is the whole histogram-vs-summary tradeoff.**

Lab note: the Python client doesn't implement client-side quantiles, so
`app_response_size_bytes` here emits only `_sum` and `_count` — no `{quantile}`
series to look at. Quantile support is a **per-client-library** feature (Go and
Java have it), not part of the exposition format. Good thing to know, and a
reminder that the lab can only show me so much.
</details>

### 9. The highest 5-minute request rate seen at any point in the last hour.
<details><summary>Answer</summary>

```promql
max_over_time( sum(rate(app_requests_total[5m]))[1h:1m] )
```
A **subquery**: evaluate the inner expression every 1m over the last 1h, then
take the max of the resulting range vector. Expensive — in production this
should be a recording rule.
</details>

### 10. Compare this hour's request rate to the same hour yesterday.
<details><summary>Answer</summary>

```promql
sum(rate(app_requests_total[5m]))
  / sum(rate(app_requests_total[5m] offset 1d))
```
A value near 1 means traffic is unchanged. This is the shape of most
week-over-week anomaly alerts.
</details>

### 11. Multi-window burn rate: is the error budget burning 14× too fast?
<details><summary>Answer</summary>

```promql
(
  sum(rate(app_requests_total{status=~"5.."}[5m])) / sum(rate(app_requests_total[5m]))
) > (14.4 * 0.001)
```
With a 99.9% SLO, the allowed error ratio is 0.001. Burning at 14.4× exhausts a
30-day budget in about two days — the standard fast-burn page. The slow-burn
companion uses a 1h/6h window at 6×.
</details>

### 12. Turn the p95 query into a recording rule and query the result.
<details><summary>Answer</summary>

It's already in `lab/prometheus/rules/recording.rules.yml`:

```promql
job:app_request_duration_seconds:p95_5m
```
The naming convention is `level:metric:operations` — the colons are what mark a
series as rule-generated, and are why colons are illegal in exposed metric names.
</details>

---

**Score:** ✅ ___ / 🟡 ___ / ❌ ___
