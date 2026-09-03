# Drill 03 — Aggregation and vector matching

### 1. Total request rate, keeping only the `job` label.
<details><summary>Answer</summary>

```promql
sum by (job) (rate(http_requests_total[5m]))
```
`by` **keeps only** what you list. `method`, `endpoint`, `code`, `instance` are all gone.
</details>

### 2. Total request rate, keeping everything *except* `code`.
<details><summary>Answer</summary>

```promql
sum without (code) (rate(http_requests_total[5m]))
```
</details>

### 3. How many targets are up, per job?
<details><summary>Answer</summary>

```promql
count by (job) (up == 1)
```
</details>

### 4. The five slowest blackbox probes.
<details><summary>Answer</summary>

```promql
topk(5, probe_duration_seconds)
```
</details>

### 5. How many series exist per metric name? (cardinality hunting)
<details><summary>Answer</summary>

```promql
topk(10, count by (__name__) ({__name__=~".+"}))
```
Expensive — don't run this against production. `/api/v1/status/tsdb` gives you
the same information cheaply, and Prometheus's own TSDB status page shows the
top cardinality metrics and labels.
</details>

### 6. What's the difference between `avg(http_in_flight_requests)` and `avg_over_time(http_in_flight_requests[5m])`?
<details><summary>Answer</summary>

`avg(...)` averages **across series** at a single instant — one number per
evaluation, collapsing all instances.
`avg_over_time(...[5m])` averages **one series across time** — it keeps every
series, but smooths each one over the window.
Different axes. Combine them: `avg(avg_over_time(x[5m]))`.
</details>

### 7. Join the request rate to `app_build_info` so the result carries the `version` label.
<details><summary>Answer</summary>

```promql
sum by (job, route) (rate(http_requests_total[5m]))
  * on (job) group_left (version)
    app_build_info
```
The **arrow points at the "many" side** — many route-series on the left, one
build_info series on the right. The labels in `group_left(version)` are copied
**from the "one" side** onto the result. Multiplying by an info metric works
because it's always `1`.
</details>

### 8. Why does `rate(http_requests_total[5m]) / http_in_flight_requests` return nothing?
<details><summary>Answer</summary>

One-to-one matching requires **identical label sets**. The left side carries
`method`, `endpoint`, `code`; the right side doesn't. Nothing matches, and
Prometheus tells you nothing — silently empty. Fix with `on()` or `ignoring()`:

```promql
sum(rate(http_requests_total[5m])) / sum(http_in_flight_requests)
```
</details>

### 9. Which targets are up but have never served a request?
<details><summary>Answer</summary>

```promql
up{job="sample-app"} == 1 unless on (instance) (sum by (instance) (http_requests_total) > 0)
```
`unless` is set subtraction on label sets. `and` / `or` / `unless` all use
vector matching, so `on()` / `ignoring()` apply to them too.
</details>

### 10. Create a `host` label from `instance` by stripping the port.
<details><summary>Answer</summary>

```promql
label_replace(up, "host", "$1", "instance", "([^:]+):.*")
```
Arguments in order: vector, **destination** label, replacement (with `$1`
capture groups), **source** label, regex.
</details>

### 11. Alert-ready expression: no `sample-app` target exists at all.
<details><summary>Answer</summary>

```promql
absent(up{job="sample-app"})
```
`up == 0` can never fire for a target that's gone from service discovery
entirely — there is no series to evaluate. `absent()` returns 1 when the
selector matches nothing.
</details>

### 12. Count how many instances are running each app version.
<details><summary>Answer</summary>

```promql
count by (version) (app_build_info)
```
Also try `count_values("version", app_build_info)` — it puts the *value* of
each series into a new label, which is a different (and more exotic) tool.
</details>

---

**Score:** ✅ ___ / 🟡 ___ / ❌ ___
