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
> [Candidate Handbook](https://docs.linuxfoundation.org/tc-docs/certification/lf-handbook2)
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

## Self-assessment tracker

Rate 1–5 at the end of each week. 1 = never seen it, 5 = could teach it.

| Topic | W1 | W2 | W3 | Notes |
|---|:--:|:--:|:--:|---|
| Metrics vs logs vs traces | | | | |
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
| Selectors and matchers | | | | |
| Instant vector vs range vector | | | | |
| `rate` / `irate` / `increase` | | | | |
| Aggregation with `by` / `without` | | | | |
| Vector matching, `group_left` / `group_right` | | | | |
| `histogram_quantile` | | | | |
| Subqueries, `offset`, `@` | | | | |
| Exposition format & metric naming | | | | |
| Client libraries & instrumentation | | | | |
| node_exporter, blackbox, pushgateway | | | | |
| Recording rules | | | | |
| Alerting rules: `for`, pending, firing | | | | |
| Alertmanager routing, grouping, inhibition, silences | | | | |
| Grafana with Prometheus as a datasource | | | | |

## Booking checklist

- [ ] Read the Candidate Handbook end to end
- [ ] Check the ID requirements (government photo ID, name must match)
- [ ] Test the proctoring software and my webcam
- [ ] Clear the desk, check the room requirements
- [ ] Book the slot — **book it early, it forces the deadline**
- [ ] Confirm the exam is against the current curriculum version in
      [cncf/curriculum](https://github.com/cncf/curriculum)
