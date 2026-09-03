# Flashcards

Cover the right column. Say the answer out loud before uncovering it — recall,
not recognition.

Sections follow the [CNCF PCA curriculum](https://github.com/cncf/curriculum)
sub-topics, in exam-domain order. Service Discovery is examined under
Observability; Exposition Format under Fundamentals — cards sit in the domain
they will be asked under, not the note file they live in.

> Import into Anki: copy a table body, strip the leading/trailing `|`, import
> as pipe-separated with two fields.

## Observability Concepts

### Metrics

| Question | Answer |
|---|---|
| The three pillars of observability | Metrics, logs, traces |
| Which pillar's storage cost doesn't grow with traffic? | Metrics — they're aggregates, not per-event records |
| USE stands for, and applies to | Utilization, Saturation, Errors — **resources** |
| RED stands for, and applies to | Rate, Errors, Duration — **request-driven services** |
| The Four Golden Signals | Latency, Traffic, Errors, Saturation |
| Order the three signals are used in an incident | Metrics detect, logs diagnose, traces locate |
| Which signal belongs to Prometheus? | Metrics. Logs go to Loki/ELK; traces to Jaeger/Tempo/OTel |

### Understand logs and events

| Question | Answer |
|---|---|
| Structured vs unstructured log | Structured is machine-parseable by field (JSON/key=value); unstructured needs grep and hope |
| Why logs are wrong for always-on alerting | Cost grows per event, and search slows exactly when an incident needs it |

### Tracing and Spans

| Question | Answer |
|---|---|
| What a span carries | Trace ID, its own span ID, parent span ID, duration, attributes. The root span has no parent |
| Context propagation | Passing trace and span IDs between services; W3C standardises the `traceparent` header |
| Head-based vs tail-based sampling | Head decides up front; tail decides after the request finishes, so it can keep every slow trace |
| Exemplar | A trace ID attached to a metric sample — the bridge from a latency spike to one causing request |

### Push vs Pull

| Question | Answer |
|---|---|
| Prometheus's default collection model | Pull — HTTP GET `/metrics` on `scrape_interval` |
| Two things Prometheus gets free from pulling | Target liveness (`up`) and centralised target configuration |
| When is push the right choice? | A job shorter than the scrape interval — Pushgateway. Long-running services stay pulled |

### Service Discovery

| Question | Answer |
|---|---|
| The five Kubernetes SD roles | node, service, pod, endpoints, endpointslice, ingress — there is no `deployment` role |
| Which SD mechanism re-reads files on change | `file_sd_configs` |
| Why use service discovery instead of a static list? | Targets come and go; SD plus relabeling keeps scrape config from rotting |

### Basics of SLOs, SLAs, and SLIs

| Question | Answer |
|---|---|
| SLI vs SLO vs SLA | Indicator = the measurement; Objective = the internal target; Agreement = the contract with penalties |
| Error budget of a 99.9% / 30-day SLO | 0.1% ≈ 43 minutes |
| Which is stricter, the SLO or the SLA? | The SLO — you want to breach your own target first |
| Histogram SLO bucket rule | Put a bucket boundary **on the SLO threshold** (e.g. 30s) so `histogram_quantile` can see it |

## Prometheus Fundamentals

### System Architecture

| Question | Answer |
|---|---|
| Main Prometheus server components | Retrieval (scrape), TSDB, PromQL engine, HTTP API, rule evaluator |
| Is Alertmanager inside Prometheus? | No — a separate process. Prometheus fires; Alertmanager notifies |
| Who queries whom, Grafana and Prometheus? | Grafana queries Prometheus. Never the reverse |

### Configuration and Scraping

| Question | Answer |
|---|---|
| Default `scrape_interval` | 1 minute |
| Default `scrape_timeout` | 10 seconds |
| Default `evaluation_interval` | 1 minute |
| Default `metrics_path` and `scheme` | `/metrics`, `http` |
| Rule for scrape_timeout vs scrape_interval | `scrape_timeout` must be **less than** `scrape_interval` |
| How to reload config without a restart | `SIGHUP`, or `POST /-/reload` with `--web.enable-lifecycle` |
| Relabel actions | replace, keep, drop, labelmap, labeldrop, labelkeep, hashmod, lowercase, uppercase, keepequal, dropequal |
| Special target labels at relabel time | `__address__`, `__scheme__`, `__metrics_path__`, `__param_<name>`, `__meta_*` |
| `relabel_configs` runs when? | **Before** the scrape — it selects and shapes the *target* |
| `metric_relabel_configs` runs when? | **After** the scrape — it drops/rewrites individual *metrics* |
| Which relabel block do I use to cut cardinality? | `metric_relabel_configs` |
| Three consumers of `external_labels` | Federation, remote_write, alerts sent to Alertmanager |

### Understanding Prometheus Limitations

| Question | Answer |
|---|---|
| Is Prometheus clustered? | No. HA = two identical independent servers; Alertmanager does the dedup |
| What federation is for | One Prometheus scraping selected (usually aggregated) series from another via `/federate` |
| Long-term storage options | remote_write to Thanos / Cortex / Mimir / VictoriaMetrics |
| Why Prometheus is wrong for billing | Samples are periodic and rate/increase extrapolate — counts are approximate by design |
| What drives Prometheus memory usage | The number of **active series**, not sample volume or retention |
| Four things stock Prometheus does not give you | Replicated storage, long-term retention, multi-tenancy/auth, exactly-once delivery |
| Recommended local filesystem for TSDB | ext4 or XFS — not NFS |
| How to monitor a network router | SNMP exporter — the router does not speak the exposition format |

### Data Model and Labels

| Question | Answer |
|---|---|
| What a sample physically is | An int64 millisecond timestamp + a float64 value |
| The reserved label holding the metric name | `__name__` |
| Two labels every target automatically gets | `job` and `instance` |
| Definition of cardinality | The number of distinct time series = unique combinations of metric name + label values |
| Three label values that cause a cardinality bomb | User IDs, email addresses, full URLs / session IDs / timestamps |
| Default retention | 15 days |
| How often the head block is flushed to disk | Every 2 hours |
| What protects in-memory samples before that flush | The write-ahead log (WAL) |
| Default staleness lookback | 5 minutes |
| The four metric types | Counter, Gauge, Histogram, Summary |
| Are metric types enforced by the TSDB? | No — the type is a convention carried in `# TYPE` |
| Histogram vs summary: which aggregates across instances? | Histogram |
| Histogram vs summary: which computes quantiles in the client? | Summary |

### Exposition Format

| Question | Answer |
|---|---|
| The two `#` lines in the exposition format | `# HELP <name> <text>` and `# TYPE <name> <type>` |
| What OpenMetrics adds | `# EOF` terminator, exemplars, native histograms, standardised naming |

## PromQL

### Selecting Data

| Question | Answer |
|---|---|
| The four PromQL expression types | Instant vector, range vector, scalar, string |
| Instant vector vs range vector | Instant is one sample per series *now*; range (`metric[5m]`) is a window and cannot be graphed until a function reduces it |
| The four label matchers | `=`, `!=`, `=~`, `!~` |
| Are PromQL regexes anchored? | Yes, fully — `job=~"api"` does not match `api-server` |
| What does `offset` do? | Shifts the evaluation into the past: `http_requests_total offset 1h` |

### Rates and Derivatives

| Question | Answer |
|---|---|
| What `rate()` takes and returns | Takes a range vector, returns an instant vector |
| `rate` vs `irate` | `rate` averages over the whole window; `irate` uses only the last two samples |
| `rate` vs `increase` | `increase(x[t])` == `rate(x[t]) * t` |
| Minimum samples `rate()` needs | Two — make the range at least 4× the scrape interval |
| Why `increase()` returns non-integers | It extrapolates to the window edges |
| `sum(rate(x[5m]))` or `rate(sum(x)[5m:])`? | **Rate first, then sum** — summing hides counter resets |
| `rate()` or `deriv()` for temperature? | `deriv()` — temperature is a gauge. `rate()` is for counters |

### Aggregating over time

| Question | Answer |
|---|---|
| `avg(x)` vs `avg_over_time(x[5m])` | Across series at one instant, vs across time for one series |
| What a subquery looks like | `max_over_time(rate(x[5m])[1h:1m])` |
| Function to extrapolate a gauge into the future | `predict_linear(v[1h], 4*3600)` |

### Aggregating over dimensions

| Question | Answer |
|---|---|
| `by` vs `without` | `by` keeps only the listed labels; `without` removes them |
| What `topk(3, x)` returns | Three **series** with their labels, not a single number |
| Average temperature per instance, metric labelled `{instance,cpu}` | `avg by (instance) (node_cpu_temp_celsius)` — collapses cpu, keeps instance |

### Binary operators

| Question | Answer |
|---|---|
| Default vector matching behaviour | One-to-one on **all** labels; unmatched series vanish silently |
| `on()` vs `ignoring()` | `on` matches only the listed labels; `ignoring` matches on all except the listed ones |
| What `group_left` means | Many series on the **left**; extra labels are copied from the "one" side |
| What `unless` does | Set subtraction — left-hand series that have no match on the right |
| What `group_right` means | Many series on the **right**; extra labels copied from the "one" (left) side |
| When the `bool` modifier is required | Comparing two scalars; also to get 1/0 instead of filtering |
| Operator precedence, highest first | `^`, then `* / %`, then `+ -`, then comparison, then `and`/`unless`, then `or` |

### Histograms

| Question | Answer |
|---|---|
| Two requirements for `histogram_quantile` | `rate()` the buckets first, and keep `le` through the aggregation |
| Average latency from a histogram | `rate(x_sum[5m]) / rate(x_count[5m])` |
| Which bucket always exists | `le="+Inf"`, equal to `_count` |
| What happens if you drop `le` before `histogram_quantile`? | NaN — there is nothing to interpolate between |

### Timestamp Metrics

| Question | Answer |
|---|---|
| `time()` vs `timestamp(v)` | Query evaluation time, vs when each sample in v was recorded |
| Alert that a nightly job did not run | `time() - x_last_success_timestamp_seconds > 86400` |
| Why a counter cannot express "it never ran" | Nothing increments on failure. A last-success timestamp drifts instead |
| Function to alert that a series has vanished entirely | `absent()` — `up == 0` can't fire for a target that no longer exists |
| Timezone of `hour()` and `day_of_week()` | UTC. Use Alertmanager `mute_time_intervals` for local business hours |
| Is `hour() >= 8 < 18` valid? | No — PromQL has no chained comparison. Use two clauses joined with `and` |

## Instrumentation and Exporters

### Client Libraries

| Question | Answer |
|---|---|
| Official client libraries | Go, Java, Python, Ruby — the official four. Rust and .NET are third-party |
| Should the client set `job` and `instance`? | No — Prometheus attaches them on scrape |

### Instrumentation

| Question | Answer |
|---|---|
| The three series a histogram emits | `_bucket{le}`, `_sum`, `_count` |
| The three series a summary emits | `{quantile}`, `_sum`, `_count` |
| Current CPU temperature should be a | Gauge — it goes up and down. Counters only increase |

### Exporters

| Question | Answer |
|---|---|
| node_exporter port | 9100 |
| blackbox_exporter port | 9115 |
| Pushgateway port | 9091 |
| Alertmanager port | 9093 |
| cAdvisor vs kube-state-metrics | Container **resource usage** vs Kubernetes **object state** |
| When to use the Pushgateway | Short-lived **batch** jobs whose lifetime is shorter than a scrape interval |
| Three Pushgateway caveats | Metrics persist until explicitly deleted; single point of failure; you lose per-instance `up` |
| Why the Pushgateway scrape uses `honor_labels: true` | So the pushed `job`/`instance` labels aren't overwritten by Prometheus |
| The blackbox relabel trick | `__address__` → `__param_target`, `__param_target` → `instance`, then `__address__` → the exporter's address |
| Key blackbox output metrics | `probe_success`, `probe_duration_seconds`, `probe_http_status_code`, `probe_ssl_earliest_cert_expiry` |
| Black-box vs white-box monitoring | Probing from outside vs instrumenting from inside |
| The node_exporter feature for batch-job metrics on a host | The textfile collector |

### Structuring and naming metrics

| Question | Answer |
|---|---|
| What units metrics should use | Base units — seconds, bytes, ratios (0–1) — never ms or percent |
| Suffix convention for counters | `_total` |
| Which character is reserved for recording rules | The colon `:` |
| Correct latency metric name | `http_request_duration_seconds` — snake_case, base unit, unit suffix |

## Alerting and Dashboarding

### Dashboarding basics

| Question | Answer |
|---|---|
| Is Grafana part of Prometheus? | No — it's a separate project, the de facto dashboarding layer |
| Grafana variable for a safe `rate()` range | `$__rate_interval` |
| Grafana heatmap needs which metric type? | Histogram (`_bucket`). A Summary cannot be merged into a heatmap |

### Configuring Alerting rules

| Question | Answer |
|---|---|
| Who decides an alert is firing, and who decides who's notified? | Prometheus fires; Alertmanager routes |
| The three alert states | inactive → pending → firing |
| Which states are sent to Alertmanager | Only **firing** |
| What `for` does | Requires the expression to stay true that long before firing — filters flapping |
| Recording rule naming convention | `level:metric:operations`, e.g. `job:http_requests:rate5m` |
| Rules in the same group run how? | Sequentially — a later rule may use an earlier one's output |
| Rules in different groups run how? | In parallel — never depend across groups |
| Labels vs annotations on an alert | Labels are for machine routing; annotations are for humans, and support templating |
| Templating variables available in annotations | `{{ $labels.x }}`, `{{ $value }}`, plus helpers like `humanize`, `humanizePercentage` |
| Metric exposing Prometheus's own alerts | `ALERTS{alertname, alertstate}` and `ALERTS_FOR_STATE` |
| Tools that validate config | `promtool check config`, `promtool check rules`, `promtool test rules`, `amtool check-config` |

### Understand and Use Alertmanager

| Question | Answer |
|---|---|
| `group_wait` | How long to hold a **brand-new** group before the first notification (30s) |
| `group_interval` | How long before sending an **update** to a group that already notified (5m) |
| `repeat_interval` | How long before **re-sending an unchanged** alert (4h) |
| Grouping does what | Bundles related alerts into one notification |
| Inhibition does what | Suppresses alert B while alert A fires — needs `equal:` labels to match |
| Silencing does what | Manually mutes matching alerts for a time window — the only manual one |
| `continue: true` on a route | Keep matching sibling routes after this one matches — how one alert reaches two receivers |
| Default routing behaviour | First matching child wins, unless `continue: true` |
| How do you reload Alertmanager? | SIGHUP, `POST /-/reload`, or restart — there is **no** Reload button in the UI |
| How Alertmanager achieves HA | A gossip cluster; every Prometheus points at **all** peers, and the cluster dedupes |

### Alerting basics

| Question | Answer |
|---|---|
| Alert on symptoms or causes? | Symptoms — "users are getting errors", not "CPU is high" |
| Three tests an alert must pass to page | Urgent, actionable, and needs human judgement |
| Symptom vs cause alerting, and why | Alert on symptoms: causes multiply with the architecture, symptoms stay few |
| Cost of alert fatigue | A responder trained by false pages is slower to the real one |
| What `runbook_url` is for | At 3am it is the difference between a two-minute fix and reconstructing your reasoning |
