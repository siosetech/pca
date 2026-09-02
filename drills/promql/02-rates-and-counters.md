# Drill 02 — Counters, rates, gauges

### 1. Requests per second across the whole app, over the last 5 minutes.
<details><summary>Answer</summary>

```promql
sum(rate(app_requests_total[5m]))
```
**Rate first, then sum.** Summing before rating hides counter resets.
</details>

### 2. Requests per second, broken down by route.
<details><summary>Answer</summary>

```promql
sum by (route) (rate(app_requests_total[5m]))
```
</details>

### 3. How many requests happened in total over the last hour?
<details><summary>Answer</summary>

```promql
sum(increase(app_requests_total[1h]))
```
`increase(x[1h])` == `rate(x[1h]) * 3600`. The result is usually **not a whole
number** because Prometheus extrapolates to the window edges. Not a bug.
</details>

### 4. The most recent, spikiest view of the request rate.
<details><summary>Answer</summary>

```promql
irate(app_requests_total[5m])
```
`irate` uses only the **last two samples** in the window. Great for zoomed-in
graphs, bad for alerting — it flaps.
</details>

### 5. Try `rate(app_requests_total[10s])` with a 5s scrape interval. Then `[5s]`. What happens?
<details><summary>Answer</summary>

`[10s]` gives you 2 samples — the bare minimum, and one missed scrape empties it.
`[5s]` gives you 1 sample and returns **nothing at all**: `rate` needs at least
two points to compute a difference. Rule of thumb: **range ≥ 4× scrape interval.**
</details>

### 6. Error rate: 5xx responses per second.
<details><summary>Answer</summary>

```promql
sum(rate(app_requests_total{status=~"5.."}[5m]))
```
</details>

### 7. Error *ratio* — the fraction of requests that failed (0–1).
<details><summary>Answer</summary>

```promql
sum(rate(app_requests_total{status=~"5.."}[5m]))
  / sum(rate(app_requests_total[5m]))
```
Both sides collapse to a single series with no labels, so they match trivially.
Try it **without** the outer `sum()` on each side and watch it return nothing —
the label sets don't line up because one side has `status="500"` and the other
has several values.
</details>

### 8. Which route has the highest error ratio?
<details><summary>Answer</summary>

```promql
sum by (route) (rate(app_requests_total{status=~"5.."}[5m]))
  / sum by (route) (rate(app_requests_total[5m]))
```
Routes with zero errors disappear entirely (no series on the left to match).
Add `or on() vector(0)` if you need them shown as 0.
</details>

### 9. How many in-flight requests are there right now?
<details><summary>Answer</summary>

```promql
app_inflight_requests
```
It's a **gauge** — read it directly. `rate()` on it would be meaningless.
</details>

### 10. Has the sample app restarted in the last hour?
<details><summary>Answer</summary>

```promql
changes(process_start_time_seconds{job="sample-app"}[1h]) > 0
```
`resets(counter[1h])` is the counter-specific equivalent.
</details>

### 11. Host CPU utilisation as a percentage, per instance.
<details><summary>Answer</summary>

```promql
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```
`node_cpu_seconds_total` is a counter of seconds-spent-per-mode-per-core.
`rate()` turns it into "fraction of a second per second" = utilisation.
`avg by (instance)` averages across the cores.
</details>

### 12. Memory utilisation as a ratio.
<details><summary>Answer</summary>

```promql
1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)
```
Two gauges with identical label sets, so one-to-one matching just works.
</details>

### 13. Will the root filesystem fill up within the next 4 hours?
<details><summary>Answer</summary>

```promql
predict_linear(node_filesystem_avail_bytes{mountpoint="/"}[1h], 4 * 3600) < 0
```
Least-squares extrapolation over the trailing hour. Gauge in, gauge out.
</details>

### 14. Average bytes received per second on each network interface, top 3.
<details><summary>Answer</summary>

```promql
topk(3, sum by (device) (rate(node_network_receive_bytes_total[5m])))
```
`topk` returns **series**, keeping their labels — not a single number.
</details>

---

**Score:** ✅ ___ / 🟡 ___ / ❌ ___
