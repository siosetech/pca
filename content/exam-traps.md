# Exam traps (Pearson L13 extras)

- Heatmap → Histogram `_bucket`, not Summary.
- Prometheus TSDB → local ext4/XFS. Not NFS.
- Network router → SNMP exporter. Not node_exporter on the router.
- Logs ≠ metrics ≠ traces. Prometheus is metrics only.
- Short-lived batch → Pushgateway. Long-running → scrape.
- Pushgateway scrape job → `honor_labels: true`.
- Default labels on every series: `job`, `instance`.
- Drop *targets* → `relabel_configs`. Drop *series* after scrape → `metric_relabel_configs`.
- Alertmanager has no Reload button. `POST /-/reload` or SIGHUP. (`--web.enable-lifecycle` is **Prometheus only**.)
- Ignored firing alert resends after Alertmanager `repeat_interval` (not Prometheus's 1m `--rules.alert.resend-delay`).
- First matching route wins unless `continue: true`.
- `up == 0` → target configured but scrape failed. `absent()` → no series at all.
- `rate()`/`increase()` → counters. `deriv()`/`delta()` → gauges.
- High cardinality labels (`user_id`, email) exhaust TSDB.
- Histogram SLO: put a bucket boundary on the SLO threshold (e.g. 30s).
- Client libraries (official): Go, Java, Python, Ruby.
- `kubernetes_sd_configs` roles: node, pod, service, endpoints, endpointslice, ingress. No `deployment` role.
- Open book: no. Do not leave the exam screen (OnVue).
