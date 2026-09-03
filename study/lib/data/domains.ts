export type Domain = {
  slug: string;
  weight: number;
  title: string;
  subtitle: string;
  topics: string[];
  sections: { heading: string; body: string; exam?: string }[];
};

export const domains: Domain[] = [
  {
    slug: "observability",
    weight: 18,
    title: "Observability Concepts",
    subtitle: "Metrics, logs, traces, pull vs push, SD, SLO/SLI/SLA",
    topics: [
      "Metrics",
      "Logs and events",
      "Tracing and spans",
      "Push vs Pull",
      "Service Discovery",
      "SLOs, SLAs, and SLIs",
    ],
    sections: [
      {
        heading: "Three Pillars",
        body: "Metrics: aggregatable numeric time series (Prometheus). Logs/events: discrete textual records with high cardinality, not Prometheus’s job (Loki, ELK). Traces: request lifecycles as spans with a trace ID (Jaeger, Tempo, OTel). PCA tests 'which tool for which signal' — Prometheus is built for metrics.",
      },
      {
        heading: "Push vs Pull",
        body: "Prometheus defaults to pull: HTTP GET /metrics at scrape_interval. Advantages: you control scrape timing, the 'up' metric is generated automatically, and there are no stalled clients. Pushgateway is designed for short-lived batch jobs (so a cron job is not missed before a scrape). Pushing long-running application metrics to Pushgateway is an anti-pattern — leading to stale metrics and losing the instance label.",
        exam: "Short-lived jobs → Pushgateway. Long-running services → scrape. honor_labels: true on Pushgateway jobs to avoid overwriting job/instance labels.",
      },
      {
        heading: "Service Discovery",
        body: "Instead of hardcoding targets manually, use file_sd, dns_sd, kubernetes_sd, consul_sd, ec2_sd. In this lab, file_sd is refreshed every 30 seconds. In Kubernetes: role: pod/service/endpoints/node/ingress and __meta_kubernetes_* relabeling fields.",
      },
      {
        heading: "SLI, SLO, SLA",
        body: "SLI: measured indicator (e.g. ratio of requests completed under 30s). SLO: target objective (97%). SLA: customer agreement, typically looser than SLO, with penalties if violated. A histogram bucket boundary must be defined exactly at the SLO threshold (30s); otherwise quantile estimation is blind at that point.",
        exam: "If the SLO threshold is not in the bucket list, histogram_quantile cannot reliably evaluate that SLI.",
      },
    ],
  },
  {
    slug: "fundamentals",
    weight: 20,
    title: "Prometheus Fundamentals",
    subtitle: "Architecture, scrape, limitations, data model, exposition",
    topics: [
      "System architecture",
      "Configuration and scraping",
      "Limitations",
      "Data model and labels",
      "Exposition format",
    ],
    sections: [
      {
        heading: "Architecture",
        body: "The retrieval component scrapes targets, TSDB stores time series locally, PromQL engine executes queries, and HTTP UI/API serves them. The rule evaluator runs recording and alerting rules at evaluation_interval. Alertmanager is a separate process; Prometheus sends alerts, and notifications are Alertmanager's job. Grafana queries Prometheus, never the reverse.",
      },
      {
        heading: "Scrape Configuration",
        body: "global.scrape_interval defaults to 1m; in this lab 15s. scrape_timeout must be < scrape_interval. A scrape job always attaches job and instance labels (instance = host:port). metric_relabel_configs drops/renames series AFTER scraping; relabel_configs is for target selection (e.g., dropping before scraping).",
        exam: "Do not scrape targets with team: frontend → relabel_configs action: drop. Rename a metric name → metric_relabel_configs.",
      },
      {
        heading: "Limitations",
        body: "Prometheus is designed as a standalone single node (no clustering; HA uses two replicas + external_labels). For long-term storage, use remote_write (Thanos, Mimir, Cortex). High cardinality (user_id, email, uuid in labels) exhausts TSDB resources. Network devices are monitored via SNMP exporter; Prometheus does not scrape routers directly. Supported local filesystems: ext4/XFS; NFS is not recommended.",
      },
      {
        heading: "Data Model",
        body: "A time series = metric name + label set. Example: http_requests_total{method=\"GET\",code=\"200\"} 12. Counter only increases (can reset to 0 on restart — rate() handles this). Gauge goes up and down. Histogram produces _bucket, _sum, _count. Summary produces client-side quantiles, _sum, _count.",
      },
      {
        heading: "Exposition Format",
        body: "text/plain; version=0.0.4 OpenMetrics/Prometheus text format. HELP and TYPE lines, followed by name{labels} value timestamp(optional). Histogram: 'le' label and '+Inf' bucket are required. /metrics must return HTTP 200.",
      },
    ],
  },
  {
    slug: "promql",
    weight: 28,
    title: "PromQL",
    subtitle: "Heaviest exam domain (28%) — rate, aggregation, binary operators, histograms",
    topics: [
      "Selecting data",
      "Rates and derivatives",
      "Aggregating over time",
      "Aggregating over dimensions",
      "Binary operators",
      "Histograms",
      "Timestamp metrics",
    ],
    sections: [
      {
        heading: "Selectors",
        body: "{job=\"node\"} equality, {job!=\"node\"} inequality, {job=~\"web|node\"} regex match, {job!~\"dev.*\"} negative regex. Instant vector vs range vector: metric[5m] is a range vector and cannot be graphed directly; it requires rate/increase/avg_over_time.",
        exam: "job=web or job=node → {job=~\"web|node\"}",
      },
      {
        heading: "rate, irate, increase",
        body: "rate(): per-second average rate over the range window, handles counter resets, default for graphing. irate(): instant rate based on the last two data points, captures spikes; too volatile/noisy for alerting. increase(): total increase over the window ≈ rate() * window_seconds. deriv(): calculates derivative for gauges, never for counters.",
      },
      {
        heading: "Time vs Dimensions",
        body: "*_over_time (avg_over_time, max_over_time) takes a range vector and aggregates over time. sum/avg/max by (instance) takes an instant vector and aggregates across dimensions/labels. 'Average CPU across each node' → avg by (instance) (node_cpu_temp_celsius).",
      },
      {
        heading: "Binary Operators and Matching",
        body: "A / B defaults to one-to-one matching; all label sets must match exactly. ignoring(code) ignores specific labels. on(instance) matches strictly on specified labels. group_left / group_right performs many-to-one / one-to-many vector matching. and / or / unless are set operators. Comparisons with 'bool' (e.g. > bool) return 0 or 1.",
      },
      {
        heading: "Histograms",
        body: "histogram_quantile(0.99, sum by (le) (rate(http_request_duration_seconds_bucket[5m]))). Preserve the 'le' label — omitting 'le' in 'by (le, ...)' is a classic exam mistake. Histogram ≈ server-side buckets (aggregatable); Summary ≈ client-side quantiles, not aggregatable across instances (cannot average p99s).",
      },
      {
        heading: "Timestamp Functions",
        body: "time() returns current unix timestamp. timestamp(metric) returns the timestamp of the last sample in the series. time() - timestamp(batch_job_last_success_timestamp_seconds) calculates 'how many seconds since last successful job'. absent() returns 1 if the series does not exist — do not confuse with up==0 (where up has a value of 0, so the series exists).",
      },
    ],
  },
  {
    slug: "instrumentation",
    weight: 16,
    title: "Instrumentation and Exporters",
    subtitle: "Client libraries, metric types, naming, exporters",
    topics: [
      "Client libraries",
      "Instrumentation",
      "Exporters",
      "Structuring and naming metrics",
    ],
    sections: [
      {
        heading: "Client Libraries",
        body: "Official: Go, Java, Python, Ruby. Third-party: .NET, Node, Rust, etc. The library does three things: maintains metrics, exposes /metrics, and pushes to Pushgateway for short-lived batch jobs. The lab's sample-app uses the Python prometheus_client library.",
      },
      {
        heading: "Four Metric Types",
        body: "Counter: http_requests_total — monotonically increasing, never decreases. Gauge: temperature, queue depth, in-flight requests. Histogram: latency/size distributions, heatmaps, and quantiles. Summary: client-side quantiles; cannot be used for heatmaps (exam trap). Calculate uptime with process_start_time_seconds gauge + time().",
        exam: "Heatmap → Histogram. 'current temperature' → Gauge. 'requests since start' → Counter.",
      },
      {
        heading: "Metric Naming & Conventions",
        body: "Use base_unit_suffix: http_request_duration_seconds, node_memory_MemAvailable_bytes. Suffix counters with _total. Do not embed application names into metric names; use labels. Avoid user_id / email in labels (high cardinality risk). Do not set job and instance labels manually; Prometheus attaches them automatically.",
      },
      {
        heading: "Exporters",
        body: "Node Exporter: *nix host metrics. Windows Exporter. Blackbox: external probing (HTTP/TCP/ICMP/DNS) — blackbox, not whitebox instrumentation. mysqld, redis, snmp, cadvisor. If you control the application code, instrument directly with a client library instead of using an exporter.",
      },
    ],
  },
  {
    slug: "alerting",
    weight: 18,
    title: "Alerting & Dashboarding",
    subtitle: "Rules, Alertmanager, when to alert, dashboards",
    topics: [
      "Dashboarding basics",
      "Configuring alerting rules",
      "Alertmanager",
      "Alerting basics",
    ],
    sections: [
      {
        heading: "When to Alert",
        body: "Alert on symptoms (user-facing impact: error ratio, latency, probe failure), not causes (e.g. CPU 90%). Alerts must be actionable. Recording rules precompute expensive queries for dashboards and rules. Alert rules are defined in separate YAML files loaded via rule_files; never placed inside scrape_configs.",
      },
      {
        heading: "Alerting Rules",
        body: "alert: Name, expr:, for: (pending → firing transition duration), labels: (severity, team — used for routing), annotations: (summary, description — can interpolate $labels / $value). 'for: 1m' avoids alert noise from temporary spikes. ALERTS and ALERTS_FOR_STATE are built-in time series.",
      },
      {
        heading: "Alertmanager",
        body: "group_by aggregates similar alerts into a single notification. group_wait buffers the initial notification to batch sibling alerts. group_interval controls intervals before sending notifications about new alerts in the same group. repeat_interval resends alerts if they remain unacknowledged (exam: 'how long before resending?' → repeat_interval). inhibit_rules: mutes HighErrorRate when InstanceDown is already firing. Silences can be created via UI or API. Config reload: SIGHUP, /-/reload HTTP POST, or process restart — there is no 'reload button in the UI'.",
        exam: "The routing tree stops at the first matching route (unless continue: true). 'matchers' is the modern syntax; legacy 'match:' syntax may still appear.",
      },
      {
        heading: "Dashboarding",
        body: "Grafana is not a CNCF product on the exam, but questions ask 'which query for heatmap/graph/stat panel'. Rates belong in graphs. Instant 'up' in stat panels. Histograms in heatmaps. RED method: Rate, Errors, Duration. USE method: Utilization, Saturation, Errors. In the lab, Grafana comes provisioned with the 'PCA Lab Overview' dashboard.",
      },
    ],
  },
];

export function getDomain(slug: string) {
  return domains.find((d) => d.slug === slug);
}
