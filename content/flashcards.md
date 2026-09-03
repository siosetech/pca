# Flashcards

Cover the right column. Say the answer out loud before uncovering it — recall,
not recognition. Cards I miss get re-tested the next day and again three days
later.

> Import into Anki: copy the table body, strip the leading/trailing `|`, and
> import as pipe-separated with two fields.

## Observability concepts

| Question | Answer |
|---|---|
| The three pillars of observability | Metrics, logs, traces |
| Which pillar's storage cost doesn't grow with traffic? | Metrics — they're aggregates, not per-event records |
| USE stands for, and applies to | Utilization, Saturation, Errors — **resources** |
| RED stands for, and applies to | Rate, Errors, Duration — **request-driven services** |
| The Four Golden Signals | Latency, Traffic, Errors, Saturation |
| SLI vs SLO vs SLA | Indicator = the measurement; Objective = the internal target; Agreement = the contract with penalties |
| Error budget of a 99.9% / 30-day SLO | 0.1% ≈ 43 minutes |
| Which is stricter, the SLO or the SLA? | The SLO — you want to breach your own target first |
| Two things Prometheus gets free from pulling | Target liveness (`up`) and centralised target configuration |
| Definition of cardinality | The number of distinct time series = unique combinations of metric name + label values |
| Three label values that cause a cardinality bomb | User IDs, email addresses, full URLs / session IDs / timestamps |
| Alert on symptoms or causes? | Symptoms — "users are getting errors", not "CPU is high" |

| Structured vs unstructured log | Structured is machine-parseable by field (JSON/key=value); unstructured needs grep and hope |
| Why logs are wrong for always-on alerting | Cost grows per event, and search slows exactly when an incident needs it |
| Order the three signals are used in an incident | Metrics detect, logs diagnose, traces locate |
| What a span carries | Trace ID, its own span ID, parent span ID, duration, attributes. The root span has no parent |
| Context propagation | Passing trace and span IDs between services; W3C standardises the `traceparent` header |
| Head-based vs tail-based sampling | Head decides up front; tail decides after the request finishes, so it can keep every slow trace |
| Exemplar | A trace ID attached to a metric sample — the bridge from a latency spike to one causing request |

## Prometheus fundamentals

| Question | Answer |
|---|---|
| Default `scrape_interval` | 1 minute |
| Default `scrape_timeout` | 10 seconds |
| Default `evaluation_interval` | 1 minute |
| Default `metrics_path` and `scheme` | `/metrics`, `http` |
| Default retention | 15 days |
| How often the head block is flushed to disk | Every 2 hours |
| What protects in-memory samples before that flush | The write-ahead log (WAL) |
| Default staleness lookback | 5 minutes |
| What a sample physically is | An int64 millisecond timestamp + a float64 value |
| The reserved label holding the metric name | `__name__` |
| Two labels every target automatically gets | `job` and `instance` |
| Which character is reserved for recording rules | The colon `:` |
| `relabel_configs` runs when? | **Before** the scrape — it selects and shapes the *target* |
| `metric_relabel_configs` runs when? | **After** the scrape — it drops/rewrites individual *metrics* |
| Which relabel block do I use to cut cardinality? | `metric_relabel_configs` |
| Relabel actions | replace, keep, drop, labelmap, labeldrop, labelkeep, hashmod, lowercase, uppercase, keepequal, dropequal |
| Special target labels at relabel time | `__address__`, `__scheme__`, `__metrics_path__`, `__param_<name>`, `__meta_*` |
| The five Kubernetes SD roles | node, service, pod, endpoints, endpointslice, ingress |
| Which SD mechanism re-reads files on change | `file_sd_configs` |
| Three consumers of `external_labels` | Federation, remote_write, alerts sent to Alertmanager |
| How to reload config without a restart | `SIGHUP`, or `POST /-/reload` with `--web.enable-lifecycle` |
| Is Prometheus clustered? | No. HA = two identical independent servers; Alertmanager does the dedup |
| What federation is for | One Prometheus scraping selected (usually aggregated) series from another via `/federate` |
| Long-term storage options | remote_write to Thanos / Cortex / Mimir / VictoriaMetrics |
| The four metric types | Counter, Gauge, Histogram, Summary |
| Are metric types enforced by the TSDB? | No — the type is a convention carried in `# TYPE` |
| Histogram vs summary: which aggregates across instances? | Histogram |
| Histogram vs summary: which computes quantiles in the client? | Summary |
| Why Prometheus is wrong for billing | Samples are periodic and rate/increase extrapolate — counts are approximate by design |
| What drives Prometheus memory usage | The number of **active series**, not sample volume or retention |
| Four things stock Prometheus does not give you | Replicated storage, long-term retention, multi-tenancy/auth, exactly-once delivery |

## PromQL

| Question | Answer |
|---|---|
| The four PromQL expression types | Instant vector, range vector, scalar, string |
| What `rate()` takes and returns | Takes a range vector, returns an instant vector |
| The four label matchers | `=`, `!=`, `=~`, `!~` |
| Are PromQL regexes anchored? | Yes, fully — `job=~"api"` does not match `api-server` |
| `rate` vs `irate` | `rate` averages over the whole window; `irate` uses only the last two samples |
| `rate` vs `increase` | `increase(x[t])` == `rate(x[t]) * t` |
| Minimum samples `rate()` needs | Two — make the range at least 4× the scrape interval |
| Why `increase()` returns non-integers | It extrapolates to the window edges |
| `sum(rate(x[5m]))` or `rate(sum(x)[5m:])`? | **Rate first, then sum** — summing hides counter resets |
| `by` vs `without` | `by` keeps only the listed labels; `without` removes them |
| `avg(x)` vs `avg_over_time(x[5m])` | Across series at one instant, vs across time for one series |
| What `topk(3, x)` returns | Three **series** with their labels, not a single number |
| When the `bool` modifier is required | Comparing two scalars; also to get 1/0 instead of filtering |
| Default vector matching behaviour | One-to-one on **all** labels; unmatched series vanish silently |
| What `group_left` means | Many series on the **left**; extra labels are copied from the "one" side |
| Two requirements for `histogram_quantile` | `rate()` the buckets first, and keep `le` through the aggregation |
| Average latency from a histogram | `rate(x_sum[5m]) / rate(x_count[5m])` |
| Which bucket always exists | `le="+Inf"`, equal to `_count` |
| Function to alert that a series has vanished entirely | `absent()` — `up == 0` can't fire for a target that no longer exists |
| What a subquery looks like | `max_over_time(rate(x[5m])[1h:1m])` |
| Function to extrapolate a gauge into the future | `predict_linear(v[1h], 4*3600)` |
| Operator precedence, highest first | `^`, then `* / %`, then `+ -`, then comparison, then `and`/`unless`, then `or` |
| `time()` vs `timestamp(v)` | Query evaluation time, vs when each sample in v was recorded |
| Alert that a nightly job did not run | `time() - x_last_success_timestamp_seconds > 86400` |
| Why a counter cannot express "it never ran" | Nothing increments on failure. A last-success timestamp drifts instead |
| Timezone of `hour()` and `day_of_week()` | UTC. Use Alertmanager `mute_time_intervals` for local business hours |
| Is `hour() >= 8 < 18` valid? | No — PromQL has no chained comparison. Use two clauses joined with `and` |

## Instrumentation and exporters

| Question | Answer |
|---|---|
| The two `#` lines in the exposition format | `# HELP <name> <text>` and `# TYPE <name> <type>` |
| What units metrics should use | Base units — seconds, bytes, ratios (0–1) — never ms or percent |
| Suffix convention for counters | `_total` |
| The three series a histogram emits | `_bucket{le}`, `_sum`, `_count` |
| The three series a summary emits | `{quantile}`, `_sum`, `_count` |
| Official client libraries | Go, Java/JVM, Python, Ruby, Rust, .NET |
| What OpenMetrics adds | `# EOF` terminator, exemplars, native histograms, standardised naming |
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

## Alerting and dashboarding

| Question | Answer |
|---|---|
| Who decides an alert is firing, and who decides who's notified? | Prometheus fires; Alertmanager routes |
| The three alert states | inactive → pending → firing |
| Which states are sent to Alertmanager | Only **firing** |
| What `for` does | Requires the expression to stay true that long before firing — filters flapping |
| Recording rule naming convention | `level:metric:operations`, e.g. `job:http_requests:rate5m` |
| Rules in the same group run how? | Sequentially — a later rule may use an earlier one's output |
| Rules in different groups run how? | In parallel — never depend across groups |
| `group_wait` | How long to hold a **brand-new** group before the first notification (30s) |
| `group_interval` | How long before sending an **update** to a group that already notified (5m) |
| `repeat_interval` | How long before **re-sending an unchanged** alert (4h) |
| Grouping does what | Bundles related alerts into one notification |
| Inhibition does what | Suppresses alert B while alert A fires — needs `equal:` labels to match |
| Silencing does what | Manually mutes matching alerts for a time window — the only manual one |
| `continue: true` on a route | Keep matching sibling routes after this one matches — how one alert reaches two receivers |
| Labels vs annotations on an alert | Labels are for machine routing; annotations are for humans, and support templating |
| Templating variables available in annotations | `{{ $labels.x }}`, `{{ $value }}`, plus helpers like `humanize`, `humanizePercentage` |
| Metric exposing Prometheus's own alerts | `ALERTS{alertname, alertstate}` and `ALERTS_FOR_STATE` |
| Tools that validate config | `promtool check config`, `promtool check rules`, `promtool test rules`, `amtool check-config` |
| Is Grafana part of Prometheus? | No — it's a separate project, the de facto dashboarding layer |
| Grafana variable for a safe `rate()` range | `$__rate_interval` |
| How Alertmanager achieves HA | A gossip cluster; every Prometheus points at **all** peers, and the cluster dedupes |
| Three tests an alert must pass to page | Urgent, actionable, and needs human judgement |
| Symptom vs cause alerting, and why | Alert on symptoms: causes multiply with the architecture, symptoms stay few |
| Cost of alert fatigue | A responder trained by false pages is slower to the real one |
| What `runbook_url` is for | At 3am it is the difference between a two-minute fix and reconstructing your reasoning |
