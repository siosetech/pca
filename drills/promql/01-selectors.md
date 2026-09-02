# Drill 01 — Selectors, matchers, ranges

<!-- Run against the lab. Write the query, THEN open the answer. -->

### 1. Every series named `up`.
<details><summary>Answer</summary>

```promql
up
```
The bare metric name is a valid instant-vector selector.
</details>

### 2. Only the `up` series for the `sample-app` job.
<details><summary>Answer</summary>

```promql
up{job="sample-app"}
```
</details>

### 3. Every job whose name *starts with* `blackbox`.
<details><summary>Answer</summary>

```promql
up{job=~"blackbox.*"}
```
**Regexes are fully anchored.** `job=~"blackbox"` matches nothing here, because
the real values are `blackbox-http` and `blackbox-icmp`.
</details>

### 4. Everything *except* the `prometheus` job.
<details><summary>Answer</summary>

```promql
up{job!="prometheus"}
```
</details>

### 5. Select `up` using only the `__name__` label.
<details><summary>Answer</summary>

```promql
{__name__="up"}
```
The metric name is just a reserved label. Useful when you need a regex on the
name itself: `{__name__=~"node_cpu.*"}`.
</details>

### 6. All metrics whose name begins with `app_` from the sample app.
<details><summary>Answer</summary>

```promql
{__name__=~"app_.*", job="sample-app"}
```
</details>

### 7. The last 5 minutes of raw samples for `app_requests_total`.
<details><summary>Answer</summary>

```promql
app_requests_total[5m]
```
This is a **range vector**. It shows in the Table tab but **cannot be graphed** —
that error message is worth seeing once on purpose.
</details>

### 8. The value of `app_requests_total` as it was one hour ago.
<details><summary>Answer</summary>

```promql
app_requests_total offset 1h
```
</details>

### 9. The number of series the sample app currently exposes.
<details><summary>Answer</summary>

```promql
count({job="sample-app"})
```
Compare with `scrape_samples_scraped{job="sample-app"}` — the number of samples
Prometheus took in the last scrape. Also try
`sum by (job) (scrape_samples_post_metric_relabeling)` to see the effect of
`metric_relabel_configs`.
</details>

### 10. Which targets are down right now?
<details><summary>Answer</summary>

```promql
up == 0
```
The comparison **filters**, so only failing targets come back. Add `bool` —
`up == bool 0` — and every target returns 1 or 0 instead.
</details>

### 11. How long did the last scrape of each target take?
<details><summary>Answer</summary>

```promql
scrape_duration_seconds
```
Alongside `up`, `scrape_samples_scraped`, `scrape_series_added` and
`scrape_samples_post_metric_relabeling`, these are the synthetic metrics
Prometheus adds to every scrape. Knowing they exist is exam-worthy.
</details>

### 12. Every route the sample app knows about, as a list of label values.
<details><summary>Answer</summary>

```promql
count by (route) (app_requests_total)
```
or, in Grafana's variable syntax, `label_values(app_requests_total, route)`.
</details>

---

**Score:** ✅ ___ / 🟡 ___ / ❌ ___
