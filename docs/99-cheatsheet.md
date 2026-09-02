# 99 — One-page cheat sheet

The page I re-read the morning of the exam. Everything here is a fact I've been
caught out by at least once.

## Numbers to know cold

| Thing | Value |
|---|---|
| `scrape_interval` default | **1m** |
| `scrape_timeout` default | **10s** |
| `evaluation_interval` default | **1m** |
| `metrics_path` / `scheme` defaults | `/metrics` / `http` |
| TSDB head → block flush | every **2h** |
| Default retention | **15d** |
| Staleness lookback | **5m** |
| Alert resend delay | **1m** |
| Alertmanager `resolve_timeout` default | **5m** |
| Sample size | int64 ms timestamp + float64 value |
| Exam | 90 min, multiple choice, valid **2 years** |

## Ports

| 9090 Prometheus | 9093 Alertmanager | 9091 Pushgateway | 9100 node_exporter |
|---|---|---|---|
| **9115** blackbox | **9182** windows_exporter | **8080** cAdvisor / KSM | **3000** Grafana |

## Type rules

```
rate() / increase() / irate()  :  range vector  →  instant vector   (counters only)
sum() / avg() / topk()         :  instant vector →  instant vector
*_over_time()                  :  range vector  →  instant vector
histogram_quantile()           :  needs `le` to survive aggregation
```
**Rate first, then sum.** `sum(rate(x[5m]))` ✅ · `rate(sum(x)[5m:])` ❌

## Metric types

| | Aggregatable quantiles? | Client cost | Bucket choice up front? |
|---|---|---|---|
| Histogram | **yes** | low | **yes** |
| Summary | **no** | higher (client computes) | no |

Counter → `rate()`. Gauge → read it, `deriv()`, `predict_linear()`.

## Relabel pipeline

```
SD  ──►  relabel_configs  ──►  SCRAPE  ──►  metric_relabel_configs  ──►  TSDB
        (pick/shape the target)          (drop/rewrite metrics)
```
Actions: `replace keep drop labelmap labeldrop labelkeep hashmod lowercase uppercase keepequal dropequal`

Special labels: `__address__` `__scheme__` `__metrics_path__` `__param_<x>` `__meta_*` `__name__`

## Alert state machine

`inactive` →(expr true)→ `pending` →(true for `for`)→ `firing` → Alertmanager
Only **firing** is sent.

## Alertmanager timers

- `group_wait` — first notification for a **new** group (30s)
- `group_interval` — an **update** to an existing group (5m)
- `repeat_interval` — **nag** about an unchanged alert (4h)

Grouping / inhibition / dedup = automatic. **Silence = manual.**

## Frameworks

**USE** = Utilization, Saturation, Errors → *resources*
**RED** = Rate, Errors, Duration → *services*
**Golden Signals** = Latency, Traffic, Errors, Saturation → *user-facing*

## Regex traps

Fully anchored, RE2. `job=~"api"` does **not** match `api-server`. Use `"api.*"`.

## Ten queries I should be able to write blind

```promql
up == 0
sum by (job) (rate(http_requests_total[5m]))
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100
predict_linear(node_filesystem_avail_bytes{mountpoint="/"}[1h], 4*3600) < 0
topk(5, sum by (instance) (rate(node_network_receive_bytes_total[5m])))
absent(up{job="api"})
```

## Last-minute distinctions

- Prometheus decides **whether**; Alertmanager decides **who / how often**.
- cAdvisor = container **resource usage**; kube-state-metrics = Kubernetes **object state**.
- Blackbox = **outside-in**; client library = **inside-out**.
- `by` **keeps** listed labels; `without` **removes** them.
- `avg(x)` = across series; `avg_over_time(x[5m])` = across time.
- Federation = pull aggregates **between Prometheus servers**; remote_write = ship samples **out**.
- Prometheus is **not** clustered. HA = two identical servers + a clustered Alertmanager.
- Colons in metric names ⇒ recording rules only.
