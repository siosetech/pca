# 04 — Instrumentation and Exporters (16%)

> Mental model: Prometheus only knows how to do one thing — **HTTP GET a URL and
> parse text.** Everything in this domain is about producing that text. If you
> wrote the code, you use a *client library*. If someone else wrote it, you use
> an *exporter*. If the process dies too fast to be scraped, you use the
> *Pushgateway*.

---

## 4.1 The exposition format

Plain text, one sample per line, `Content-Type: text/plain; version=0.0.4`:

```
# HELP http_requests_total Total number of HTTP requests.
# TYPE http_requests_total counter
http_requests_total{method="get",status="200"} 1027
http_requests_total{method="post",status="500"} 3

# HELP http_request_duration_seconds Request latency.
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 24054
http_request_duration_seconds_bucket{le="0.5"} 33444
http_request_duration_seconds_bucket{le="+Inf"} 34078
http_request_duration_seconds_sum 8953.33
http_request_duration_seconds_count 34078
```

- `# HELP <name> <text>` and `# TYPE <name> <counter|gauge|histogram|summary|untyped>`.
  Any other `#` line is a comment.
- One metric family per block; lines for the same family must be grouped.
- Values are float64; `+Inf`, `-Inf`, `NaN` are legal. An optional trailing
  integer is a millisecond timestamp (rarely used — let Prometheus timestamp it).
- **OpenMetrics** is the standardised successor: requires a trailing `# EOF`,
  drops the `_total` suffix from the exposed name, and adds exemplars
  (`# {trace_id="..."} 1.0 1609746000`) and native/exponential histograms.

### Naming conventions (testable)

- `snake_case`, prefixed with a namespace: `process_`, `node_`, `http_`.
- **Base units only**: `seconds` not milliseconds, `bytes` not megabytes,
  `ratio` (0–1) not percent. Convert at display time, in Grafana.
- Suffix is the unit: `..._seconds`, `..._bytes`, `..._total` for counters.
- The name must mean the same thing for every label combination — if you'd need
  a different `# HELP` per label value, it should be two metrics.
- Never use a colon (`:`) — reserved for recording rules.
- Don't put the label name in the metric name: `http_requests_total{method="get"}`,
  not `http_get_requests_total`.

## 4.2 Client libraries

Official: **Go, Java/JVM, Python, Ruby, Rust, .NET**. Many unofficial ones
(Node.js, PHP, C++). They all give you: metric registration, the four types, a
default registry, process/runtime collectors for free, and an HTTP handler.

Python, the shape of it:

```python
from prometheus_client import Counter, Gauge, Histogram, Summary, start_http_server

REQS  = Counter("app_requests_total", "Total requests", ["method", "status"])
INFLT = Gauge("app_inflight_requests", "In-flight requests")
LAT   = Histogram("app_request_duration_seconds", "Latency",
                  buckets=[.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10])

REQS.labels(method="GET", status="200").inc()
INFLT.inc(); INFLT.dec()
LAT.observe(0.42)

start_http_server(8000)          # serves /metrics
```

Instrumentation advice that shows up as exam questions:
- **Instrument the request path with RED**: a counter of requests (labelled by
  status), and a histogram of durations. That's 90% of the value.
- Choose histogram buckets to straddle your **SLO threshold** — if the SLO is
  300 ms, make sure `le="0.3"` exists.
- Keep label values **bounded** (see cardinality, `docs/01`).
- Metrics are **cheap to expose, expensive to have too many of**.

## 4.3 Exporters

| Exporter | Port | Exposes |
|---|---:|---|
| **node_exporter** | 9100 | Linux/Unix host metrics: CPU, memory, disk, filesystem, network |
| **windows_exporter** | 9182 | The same for Windows |
| **blackbox_exporter** | 9115 | Probes endpoints from the outside: HTTP, HTTPS, TCP, ICMP, DNS, gRPC |
| **cAdvisor** | 8080 | Per-container resource usage |
| **kube-state-metrics** | 8080 | Kubernetes **object state** (deployment replicas, pod phase) |
| **Pushgateway** | 9091 | Holds metrics pushed by short-lived jobs |
| mysqld / postgres / redis / jmx exporters | various | Database and JVM internals |

> **cAdvisor vs kube-state-metrics** is a favourite: cAdvisor tells you a
> container is using 400 MB; kube-state-metrics tells you the Deployment wants
> 3 replicas and only has 2. **Resource usage vs object state.**

An exporter typically runs **next to the thing it monitors** — as a sidecar, a
DaemonSet, or on the host itself.

### Blackbox exporter: the relabel dance

Blackbox is special because Prometheus scrapes *the exporter*, passing the real
target as a URL parameter. Memorise this block:

```yaml
- job_name: "blackbox-http"
  metrics_path: /probe
  params:
    module: [http_2xx]
  static_configs:
    - targets:
        - https://prometheus.io
        - http://sample-app:8000/metrics
  relabel_configs:
    - source_labels: [__address__]
      target_label: __param_target        # the target becomes ?target=...
    - source_labels: [__param_target]
      target_label: instance              # keep the real URL as `instance`
    - target_label: __address__
      replacement: blackbox:9115          # actually scrape the EXPORTER
```
Key output metrics: `probe_success` (1/0), `probe_duration_seconds`,
`probe_http_status_code`, `probe_ssl_earliest_cert_expiry`.

> Blackbox = **black-box / outside-in** monitoring: does it respond?
> Client-library instrumentation = **white-box**: why is it slow?

### Pushgateway: when, and its caveats

Use it for **service-level batch jobs** whose lifetime is shorter than a scrape
interval (a nightly backup, a cron job).

```bash
echo "backup_last_success_timestamp_seconds $(date +%s)" \
  | curl --data-binary @- http://localhost:9091/metrics/job/nightly_backup
```

Caveats the exam asks about:
- It is **not** a way to turn Prometheus into a push system. Don't route normal
  app metrics through it.
- Metrics **persist until explicitly deleted** (`DELETE` on the group URL) — a
  job that's decommissioned keeps reporting stale values forever.
- It becomes a **single point of failure** and a bottleneck.
- You lose per-instance `up` monitoring — the Pushgateway's own `up` says
  nothing about whether your job ran.
- It sets `honor_labels: true` on its scrape config so the pushed `job`/`instance`
  labels aren't overwritten.

Better alternative when it fits: have the batch job write a
`_last_success_timestamp_seconds` gauge into a textfile that node_exporter's
**textfile collector** picks up.

---

## Self-check

1. Write, from memory, the three lines a counter needs in the exposition format.
2. What units should a latency metric use, and what should the name end with?
3. cAdvisor or kube-state-metrics: which tells me a Deployment is under-replicated?
4. Why does the blackbox scrape config rewrite `__address__` last?
5. Name three reasons not to use the Pushgateway for normal application metrics.
6. My SLO is "95% of requests under 250 ms". What does that imply about my buckets?
7. What does OpenMetrics add over the classic text format?
8. Where should an exporter run relative to the thing it monitors, and why?
