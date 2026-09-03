# 02 — Prometheus Fundamentals (20%)

> Mental model: Prometheus is a loop. **Discover targets → scrape them →
> store samples → evaluate rules → push alerts to Alertmanager.** Everything in
> this domain is one of those five boxes. When a question confuses me, I ask
> which box it's about.

```
   service discovery                          ┌──────────────┐
   (static / file / k8s / consul / ec2)  ───► │              │
                                              │  Prometheus  │──► /api/v1/query ──► Grafana
   targets  /metrics  ◄── scrape (HTTP GET) ──│    server    │
                                              │  TSDB + rules│──► alerts ──► Alertmanager ──► email/Slack/PagerDuty
   pushgateway ◄── batch jobs                 └──────────────┘
```

---

## 2.1 Components

| Component | Job | Not its job |
|---|---|---|
| **Prometheus server** | Scrape, store, evaluate rules, serve PromQL | Long-term storage, dashboards, notifications |
| **Exporters** | Translate a system's stats into the exposition format | Storing anything |
| **Client libraries** | Instrument your own code | — |
| **Pushgateway** | Hold metrics from short-lived batch jobs until scraped | Being a general push endpoint |
| **Alertmanager** | Dedupe, group, route, silence, inhibit, notify | Deciding *when* to alert (Prometheus does that) |
| **Grafana** | Dashboards | It is not part of Prometheus |

**The split that gets tested:** *Prometheus decides an alert is firing;
Alertmanager decides who hears about it and how often.*

Prometheus is a **single binary with local storage**. No clustering, no
sharding built in. Scale by functional sharding (one server per team/region)
plus federation, or by pushing to a remote-write backend (Thanos, Cortex,
Mimir, VictoriaMetrics).

## 2.2 Data model

A **time series** is identified by a metric name plus a set of labels:

```
<metric_name>{<label_name>=<label_value>, ...}   →   (int64 ms timestamp, float64 value)
```

- The metric name is really just the reserved label `__name__`. These are identical:
  ```promql
  up{job="node"}
  {__name__="up", job="node"}
  ```
- Labels beginning with `__` are **internal** — used during relabeling, stripped
  before storage.
- Metric names match `[a-zA-Z_:][a-zA-Z0-9_:]*` — the colon is **reserved for
  recording rules**, never use it in a directly-exposed metric.
- Label names match `[a-zA-Z_][a-zA-Z0-9_]*`. Label **values** are arbitrary UTF-8.
- A sample is a `float64` value + an `int64` millisecond timestamp. There are
  no integers, no strings, no booleans in the TSDB.
- An empty label value is equivalent to the label not existing.

Every target automatically gets `job` (from the scrape config) and `instance`
(from `__address__`).

### The four metric types

| Type | Semantics | Exposed as | Query with |
|---|---|---|---|
| **Counter** | Only goes up; resets to 0 on restart | one series, `_total` suffix | `rate()`, `increase()` — **never the raw value** |
| **Gauge** | Goes up and down | one series | the value directly, `avg_over_time`, `delta` |
| **Histogram** | Bucketed observations, aggregatable | `_bucket{le}`, `_sum`, `_count` | `histogram_quantile(…rate(_bucket[…]) …)` |
| **Summary** | Quantiles computed **in the client** | `{quantile}`, `_sum`, `_count` | read directly — **cannot be aggregated across instances** |

> The histogram-vs-summary tradeoff is a favourite exam question:
> **histogram** = cheap client, expensive server, buckets must be chosen in
> advance, **quantiles are aggregatable across instances**.
> **summary** = accurate client-side quantiles, no bucket guessing, but
> **averaging a quantile across instances is mathematically meaningless.**
>
> The types are a **convention carried in `# TYPE`**, not enforced by the TSDB.
> A counter and a gauge are stored identically.

## 2.3 Configuration

`prometheus.yml` — top-level keys:

```yaml
global:            # defaults for everything below
  scrape_interval:     15s   # default 1m
  scrape_timeout:      10s   # default 10s, must be <= scrape_interval
  evaluation_interval: 15s   # default 1m — how often rules are evaluated
  external_labels:           # attached to metrics leaving this server
    cluster: lab             # (federation, remote_write, alerts)

rule_files:        # recording + alerting rules, globs allowed
alerting:          # where Alertmanager lives
scrape_configs:    # what to scrape
remote_write:      # ship samples out
remote_read:       # read samples from elsewhere at query time
storage:           # tsdb / exemplars settings
```

Defaults worth memorising: **`scrape_interval` 1m, `scrape_timeout` 10s,
`evaluation_interval` 1m, `metrics_path` `/metrics`, `scheme` `http`.**

Reload without restarting **Prometheus**: `SIGHUP`, or `POST /-/reload`
(needs `--web.enable-lifecycle`). **Alertmanager** has no such flag —
`POST /-/reload` or SIGHUP, and there is no Reload button in the UI.
Validate first: `promtool check config prometheus.yml`.

### A scrape_config

```yaml
scrape_configs:
  - job_name: "node"           # becomes the `job` label
    scrape_interval: 30s       # overrides global
    metrics_path: /metrics
    scheme: http
    honor_labels: false        # true = target's labels win over Prometheus'
    static_configs:
      - targets: ["node-exporter:9100"]
        labels: { env: lab }
    relabel_configs: []        # rewrite the target BEFORE the scrape
    metric_relabel_configs: [] # rewrite/drop metrics AFTER the scrape
```

## 2.4 Service discovery

| Mechanism | Use |
|---|---|
| `static_configs` | Hardcoded list. Fine for labs |
| `file_sd_configs` | JSON/YAML files, re-read on change — the generic integration point |
| `kubernetes_sd_configs` | Roles: **node, service, pod, endpoints, endpointslice, ingress** |
| `consul_sd_configs`, `dns_sd_configs`, `ec2_sd_configs`, … | Everything else |

SD produces targets carrying `__meta_*` labels (e.g.
`__meta_kubernetes_pod_label_app`). Those are **discarded before storage**
unless relabeling copies them into a real label. That is the whole point of
relabeling.

### Relabeling

Special labels available at relabel time:
`__address__` (host:port to scrape), `__scheme__`, `__metrics_path__`,
`__param_<name>` (URL query parameter), `__meta_*` (from SD).

`relabel_configs` actions:

| Action | Effect |
|---|---|
| `replace` (default) | Write `replacement` into `target_label` if `regex` matches `source_labels` |
| `keep` | Drop the target unless the regex matches |
| `drop` | Drop the target if the regex matches |
| `labelmap` | Copy labels whose *name* matches the regex to new names |
| `labeldrop` / `labelkeep` | Remove / retain labels by name regex |
| `hashmod` | `target_label = hash(source) % modulus` — used for sharding |
| `lowercase` / `uppercase` | Case-fold a label value |
| `keepequal` / `dropequal` | Keep/drop where `source_labels` equals `target_label` |

Defaults: `separator` is `;`, `regex` is `(.*)`, `replacement` is `$1`.

**`relabel_configs` vs `metric_relabel_configs`** — the single most testable
distinction in this domain:

```
SD ──► relabel_configs ──► SCRAPE ──► metric_relabel_configs ──► TSDB
       (choose/shape                  (drop or rewrite
        the TARGET)                    individual METRICS)
```
Dropping a noisy metric to save cardinality ⇒ `metric_relabel_configs`.
Deciding which pods to scrape at all ⇒ `relabel_configs`.

## 2.5 Storage (TSDB)

- Samples land in the **head block**, held in memory, and are appended to the
  **WAL** (write-ahead log) so a crash doesn't lose them.
- Every **2 hours** the head is flushed to a persistent **block** on disk.
- Blocks are immutable directories containing `chunks/`, an `index`, `meta.json`
  and `tombstones`. Deletes write tombstones; data goes at compaction.
- **Compaction** merges small blocks into bigger ones over time.
- Retention: `--storage.tsdb.retention.time` (default **15d**) and/or
  `--storage.tsdb.retention.size`. Whichever triggers first wins.
- Rough sizing: `needed_disk = retention_seconds × samples_per_second × bytes_per_sample`,
  with bytes/sample ≈ 1–2 after compression.
- Local storage is **not durable, not replicated, not clustered.** For long-term
  and HA storage: `remote_write` to Thanos / Cortex / Mimir / VictoriaMetrics.

**Staleness:** if a series stops being reported, Prometheus marks it stale and
it disappears from instant queries. The lookback window is **5 minutes** by
default — a query at time *t* looks back up to 5m for the most recent sample.
That's why `scrape_interval` should stay well under 5m.

## 2.6 Federation & HA

- **Federation** — `/federate` lets one Prometheus scrape selected series from
  another. *Hierarchical*: a global server pulls aggregates from per-DC servers.
  Don't federate everything; federate recording-rule output.
- **HA** — run **two identical Prometheus servers** scraping the same targets.
  They're independent; no state is shared. Deduplication happens in Alertmanager
  (which *is* clustered, via gossip).
- Use `external_labels` to tell the two servers apart downstream (`replica: a/b`).

## 2.7 Security & operations

- Prometheus has no built-in authentication for its own UI/API — put it behind a
  reverse proxy, or use the **web config file** for TLS and basic auth.
- Useful endpoints: `/metrics`, `/-/healthy`, `/-/ready`, `/-/reload`,
  `/api/v1/query`, `/api/v1/query_range`, `/api/v1/targets`, `/api/v1/rules`,
  `/api/v1/status/tsdb`, `/federate`.
- `promtool check config`, `promtool check rules`, `promtool query instant`,
  `promtool test rules` (unit tests for alerting rules).

> TODO: in the lab, break the scrape config on purpose and watch what
> `promtool check config` says vs what the `/targets` page says.

## 2.8 Understanding Prometheus's limitations

An explicit exam topic, and the one people revise least. Knowing what Prometheus
is *not* for is the same knowledge as knowing what it is for.

**It is not an exact accounting system.** Values are sampled at the scrape
interval, and `rate()` and `increase()` extrapolate to the window edges. If a
counter went up 4 times, `increase()` may honestly report 4.6. That is fine for
alerting and capacity work and **disqualifying for billing**, invoicing, or
anything where a number must be exactly right. Use logs or an event store there.

**It is not a log or event store.** There is no per-request record. Prometheus
holds `float64` samples against label sets and nothing else, which is exactly
why high-cardinality identifiers must stay out of labels.

**Local storage is a single node.** Not replicated, not clustered, not durable
in the way a database is. Losing the disk loses the data. HA means running two
identical servers, not a cluster.

**It is not long-term storage.** Retention defaults to 15 days. For months or
years, `remote_write` to Thanos, Cortex, Mimir or VictoriaMetrics.

**Cardinality is the hard ceiling.** Memory scales with the number of *active
series*, not with sample volume. One careless label can cost more than a year of
traffic growth.

**It has no built-in authentication or multi-tenancy.** TLS and basic auth exist
via the web configuration file; anything richer belongs behind a reverse proxy.
Every scraped target is trusted equally.

**The pull model has reach requirements.** Prometheus must be able to open a
connection to every target. Targets behind NAT, and jobs that exit before the
next scrape, need help (the Pushgateway, or the textfile collector).

**Delivery is best-effort.** A missed scrape is a gap, not a retry. There is no
exactly-once anything.

> Mental model: Prometheus answers **"how much, and is it getting worse?"** for
> a bounded set of dimensions. Every limitation above is the price of the thing
> that makes it fast and cheap at that one job.

---

## Self-check

1. What are the defaults for `scrape_interval`, `scrape_timeout` and `evaluation_interval`?
2. I want to stop storing a high-cardinality metric a third-party exporter emits. Which relabel block, and which action?
3. What does `up == 0` actually mean, and where does the `up` metric come from?
4. How often does the head block get written to disk, and what protects the data before then?
5. What's the default retention, and what are the two ways to bound it?
6. Why can't I average a summary's `quantile="0.99"` across ten pods? What should I have used?
7. What's in `external_labels`, and which three things consume it?
8. Two Prometheus servers scrape the same targets for HA. Where does deduplication happen?
9. What is the default staleness lookback, and why does it constrain my scrape interval?
10. Name the Kubernetes SD roles. (There is no `deployment` role.)
11. Give three reasons Prometheus is the wrong tool for generating customer invoices.
12. What scales Prometheus memory usage: the number of samples, or the number of active series?
13. Prometheus has no built-in authentication. What are the two ways to put access control in front of it?
