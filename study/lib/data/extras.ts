export type ExtraBlock = {
  id: string;
  pearson: string;
  title: string;
  why: string;
  body: string;
  query?: string;
};

export const extras: ExtraBlock[] = [
  {
    id: "heatmap",
    pearson: "L7 Dashboarding + L10 Instrumentation",
    title: "Grafana Heatmap",
    why: "Exam trap: heatmaps require Histograms, not Summaries.",
    body: "A latency heatmap was added to the Overview dashboard. Navigate to Grafana → PCA Lab Overview, bottom panel. Data source: http_request_duration_seconds_bucket. Summary quantiles cannot be aggregated into a heatmap.",
  },
  {
    id: "metric-relabel",
    pearson: "L3 Installing / scrape config",
    title: "metric_relabel_configs (Live)",
    why: "relabel selects targets; metric_relabel drops/modifies series after scrape.",
    body: "In the prometheus job, go_.* is dropped. Status → Targets remains unchanged; in Graph, go_goroutines is no longer scraped from this job. Relabel actions: keep, drop, replace, labelmap, labeldrop, labelkeep — example YAML in lab/prometheus/examples/relabel-actions.yml.",
    query: `{job="prometheus",__name__=~"go_.*"}`,
  },
  {
    id: "promql-plus",
    pearson: "L5 Querying (23m) vs L9 PromQL (1h41m)",
    title: "PromQL Extras",
    why: "A short video querying lesson does not cover the 28% PromQL exam weight.",
    body: "Exercises for irate, avg_over_time, deriv, absent, unless/and, and group_left have been added to the PromQL page. Run all of them in the Expression browser (http://localhost:9090).",
  },
  {
    id: "linux",
    pearson: "L11 Monitoring Linux",
    title: "Node Exporter Queries",
    why: "Host metrics: CPU, memory, disk, network. Reflects the Podman WSL machine, not the Windows host.",
    body: "node-exporter :9100. USE: Utilization / Saturation / Errors. For disk space use node_filesystem_avail_bytes; memory use node_memory_MemAvailable_bytes.",
    query: `1 - (
  node_memory_MemAvailable_bytes
  / node_memory_MemTotal_bytes
)
rate(node_network_receive_bytes_total[5m])
node_filesystem_avail_bytes{fstype!~"tmpfs|overlay"}`,
  },
  {
    id: "k8s",
    pearson: "L12 Monitoring Kubernetes",
    title: "kubernetes_sd Roles",
    why: "A live Kind cluster is not mandatory; the exam expects you to identify the YAML configs.",
    body: "Roles: node, pod, service, endpoints, ingress. Classic keep rule: annotation prometheus.io/scrape=true. Examples in lab/prometheus/examples/kubernetes-sd.yml and kubernetes-sd-roles.yml. For cluster setup, see k8s/README.md.",
  },
  {
    id: "traps",
    pearson: "L13 Exam prep",
    title: "Exam Traps & Gotchas",
    why: "Crucial details that frequently catch test-takers off-guard.",
    body: "TSDB: ext4/XFS, not NFS. Routers: SNMP exporter. Three pillars: metrics ≠ logs ≠ traces. Pushgateway is only for short-lived jobs. Use honor_labels on Pushgateway jobs. Default attached labels: job + instance. No reload button in Alertmanager UI. continue: false stops at first matching route. Silences configured via Alertmanager UI/API. Cardinality: avoid user_id in labels. Full list: drills/exam-traps.md.",
  },
  {
    id: "am-ui",
    pearson: "L8 Alerting",
    title: "Alertmanager UI Tour",
    why: "Routing is in YAML; the exam tests silences, inhibition, and grouping.",
    body: "http://localhost:9093 → Alerts, Silences. HighErrorRate fires intentionally via 5xx responses. If InstanceDown fires, inhibit suppresses HighErrorRate on the same instance. Silence: create via UI with alertname=HighErrorRate for 15m. continue: true continues matching sibling routes (currently false on critical).",
  },
  {
    id: "slo",
    pearson: "L4 Observability",
    title: "SLI / SLO / SLA",
    why: "Lab bucket is at 30s; memorize the three-way distinction.",
    body: "SLI = measured ratio (uploads ≤ 30s). SLO = internal target (97%). SLA = customer agreement, typically looser than SLO. histogram_quantile is blind if no bucket boundary is defined at the SLO threshold.",
    query: `sum(rate(upload_duration_seconds_bucket{le="30"}[5m]))
/
sum(rate(upload_duration_seconds_count[5m]))`,
  },
];
