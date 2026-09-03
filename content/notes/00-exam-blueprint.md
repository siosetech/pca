# 00 — Exam blueprint & self-assessment

## Logistics

| | |
|---|---|
| Exam | Prometheus Certified Associate (PCA) |
| Body | The Linux Foundation / CNCF |
| Format | Multiple choice, online proctored |
| Duration | 90 minutes |
| Validity | 2 years |
| Retake | One free retake included with the exam purchase |

> Verify the current question count and passing score in the
> [Candidate Handbook](https://docs.linuxfoundation.org/tc-content/notes/certification/lf-handbook2)
> — these change and I should not trust a blog post for them.
>
> `> TODO` fill in after reading the handbook: questions = ___, pass mark = ___

**This is a knowledge exam, not a hands-on one.** That changes how I study: the
lab exists to build intuition and make facts stick, not to drill command speed.
When I'm short on time, reading beats typing.

## Domain weights

```
PromQL                        ████████████████████████████  28%
Prometheus Fundamentals       ████████████████████          20%
Observability Concepts        ██████████████████            18%
Alerting and Dashboarding     ██████████████████            18%
Instrumentation and Exporters ████████████████              16%
```

PromQL and Fundamentals together are **48%** of the exam. If I only had a week,
that is where all of it would go.

## Coverage against the official curriculum

Every bullet below is taken from the
[CNCF PCA curriculum](https://github.com/cncf/curriculum/blob/master/PCA_Curriculum.pdf).
The point of this table is that a gap here is a gap in the exam, not a gap in my
filing system. Re-check it if the curriculum version changes.

### PromQL (28%)

| Official sub-topic | Covered in |
|---|---|
| Selecting Data | [`03` §3.1](03-promql.md#31-selectors) |
| Rates and Derivatives | [`03` §3.2](03-promql.md#32-counters-rate-irate-increase) |
| Aggregating over time | [`03` §3.3](03-promql.md#33-aggregation) — the `_over_time` family |
| Aggregating over dimensions | [`03` §3.3](03-promql.md#33-aggregation) — `by` / `without` |
| Binary operators | [`03` §3.4](03-promql.md#34-operators-and-vector-matching) |
| Histograms | [`03` §3.5](03-promql.md#35-histograms-and-quantiles) |
| Timestamp Metrics | [`03` §3.8](03-promql.md#38-timestamp-metrics) |

### Prometheus Fundamentals (20%)

| Official sub-topic | Covered in |
|---|---|
| System Architecture | [`02` §2.1](02-prometheus-fundamentals.md#21-components) |
| Configuration and Scraping | [`02` §2.3](02-prometheus-fundamentals.md#23-configuration) |
| Understanding Prometheus Limitations | [`02` §2.8](02-prometheus-fundamentals.md#28-understanding-prometheuss-limitations) |
| Data Model and Labels | [`02` §2.2](02-prometheus-fundamentals.md#22-data-model) |
| Exposition Format | [`04` §4.1](04-instrumentation-exporters.md#41-the-exposition-format) — filed under instrumentation, examined here |

### Observability Concepts (18%)

| Official sub-topic | Covered in |
|---|---|
| Metrics | [`01` §1.1](01-observability-concepts.md#11-the-three-pillars) |
| Understand logs and events | [`01` §1.2](01-observability-concepts.md#12-logs-and-events) |
| Tracing and Spans | [`01` §1.3](01-observability-concepts.md#13-tracing-and-spans) |
| Push vs Pull | [`01` §1.5](01-observability-concepts.md#15-push-vs-pull) |
| Service Discovery | [`02` §2.4](02-prometheus-fundamentals.md#24-service-discovery) — filed under fundamentals, examined here |
| Basics of SLOs, SLAs, and SLIs | [`01` §1.6](01-observability-concepts.md#16-sli-slo-sla-error-budget) |

### Instrumentation and Exporters (16%)

| Official sub-topic | Covered in |
|---|---|
| Client Libraries | [`04` §4.2](04-instrumentation-exporters.md#42-client-libraries) |
| Instrumentation | [`04` §4.2](04-instrumentation-exporters.md#42-client-libraries) |
| Exporters | [`04` §4.3](04-instrumentation-exporters.md#43-exporters) |
| Structuring and naming metrics | [`04` §4.1](04-instrumentation-exporters.md#41-the-exposition-format) |

### Alerting & Dashboarding (18%)

| Official sub-topic | Covered in |
|---|---|
| Dashboarding basics | [`05` §5.4](05-alerting-dashboarding.md#54-dashboarding) |
| Configuring Alerting rules | [`05` §5.2](05-alerting-dashboarding.md#52-alerting-rules) |
| Understand and Use Alertmanager | [`05` §5.3](05-alerting-dashboarding.md#53-alertmanager) |
| Alerting basics (when, what, and why) | [`05` §5.5](05-alerting-dashboarding.md#55-alerting-basics-when-what-and-why) |

**Two bullets sit in a different file than their domain.** The curriculum files
*Service Discovery* under Observability Concepts and *Exposition Format* under
Fundamentals; I wrote them where they read best. The content is complete either
way, but remember which domain they will be **examined** under.

## Self-assessment tracker

Rate 1–5 at the end of each week. 1 = never seen it, 5 = could teach it.

| Topic | W1 | W2 | W3 | Notes |
|---|:--:|:--:|:--:|---|
| Metrics vs logs vs traces | | | | |
| Structured vs unstructured logs, events | | | | |
| Traces, spans, context propagation, sampling | | | | |
| Exemplars | | | | |
| SLI / SLO / SLA, error budgets | | | | |
| USE vs RED vs Four Golden Signals | | | | |
| Push vs pull, and why Prometheus pulls | | | | |
| Prometheus architecture & components | | | | |
| Data model, samples, cardinality | | | | |
| The four metric types | | | | |
| `scrape_config` and its defaults | | | | |
| Service discovery (static, file, k8s) | | | | |
| Relabeling (`relabel_configs` vs `metric_relabel_configs`) | | | | |
| TSDB: WAL, head block, compaction, retention | | | | |
| Federation, remote read/write, HA | | | | |
| Prometheus's limitations, and why each exists | | | | |
| Selectors and matchers | | | | |
| Instant vector vs range vector | | | | |
| `rate` / `irate` / `increase` | | | | |
| Aggregation with `by` / `without` | | | | |
| Vector matching, `group_left` / `group_right` | | | | |
| `histogram_quantile` | | | | |
| Subqueries, `offset`, `@` | | | | |
| Timestamp metrics, `time()` vs `timestamp()` | | | | |
| Exposition format & metric naming | | | | |
| Client libraries & instrumentation | | | | |
| node_exporter, blackbox, pushgateway | | | | |
| Recording rules | | | | |
| Alerting rules: `for`, pending, firing | | | | |
| Alertmanager routing, grouping, inhibition, silences | | | | |
| Grafana with Prometheus as a datasource | | | | |
| When/what/why to alert, severity, runbooks | | | | |

## Booking checklist

- [ ] Read the Candidate Handbook end to end
- [ ] Check the ID requirements (government photo ID, name must match)
- [ ] Test the proctoring software and my webcam
- [ ] Clear the desk, check the room requirements
- [ ] Book the slot — **book it early, it forces the deadline**
- [ ] Confirm the exam is against the current curriculum version in
      [cncf/curriculum](https://github.com/cncf/curriculum)
