export type Exercise = {
  id: string;
  title: string;
  goal: string;
  hint: string;
  query: string;
  notes: string;
};

export const exercises: Exercise[] = [
  {
    id: "up",
    title: "Which targets are up?",
    goal: "Observe scrape success. up 1 = scrape OK, 0 = fail (the series still exists).",
    hint: "Prometheus automatically generates 'up' for every job.",
    query: "up",
    notes: "absent(up{job=\"sample-app\"}) returns 1 if the target is completely missing. up==0 means the target is configured but not responding.",
  },
  {
    id: "rate",
    title: "Request Rate (RPS)",
    goal: "Apply rate() to a counter before graphing.",
    hint: "5m window, lab scrape 15s — ensures multiple samples in the window.",
    query: "sum by (code) (rate(http_requests_total[5m]))",
    notes: "increase(http_requests_total[5m]) calculates total increase in the same window. irate() only uses the last two points and is too noisy for alerting.",
  },
  {
    id: "errors",
    title: "5xx Error Ratio",
    goal: "Error ratio: 5xx requests / total requests. Binary operations must match on identical labels.",
    hint: "Drop the code label using ignoring() or separate sum() aggregations.",
    query: `sum(rate(http_requests_total{code=~"5.."}[5m]))
/
sum(rate(http_requests_total[5m]))`,
    notes: "Lab /api/unstable produces ~28% 500 errors; the HighErrorRate alert fires at a 5% threshold.",
  },
  {
    id: "p99",
    title: "p99 Latency",
    goal: "histogram_quantile + rate + sum by (le).",
    hint: "Never drop the 'le' label in aggregation.",
    query: `histogram_quantile(
  0.99,
  sum by (le, endpoint) (rate(http_request_duration_seconds_bucket[5m]))
)`,
    notes: "φ is between 0 and 1. Histogram buckets in sample-app range from 5ms…5s.",
  },
  {
    id: "avg-cpu",
    title: "Average Across Instances, Not Per CPU",
    goal: "Aggregate across dimensions with avg by.",
    hint: "app_cpu_temp_celsius{cpu=\"0|1\"} is simulated in sample-app.",
    query: "avg by (instance) (app_cpu_temp_celsius)",
    notes: "Classic exam pattern: avg by (instance) (node_cpu_temp_celsius). rate() must never be applied to a gauge.",
  },
  {
    id: "slo",
    title: "Upload SLO: 97% < 30s",
    goal: "Bucket at 30s. Calculate the ratio of requests not slower than 30s.",
    hint: "The le=\"30\" bucket covers all observations up to 30s.",
    query: `sum(rate(upload_duration_seconds_bucket{le="30"}[5m]))
/
sum(rate(upload_duration_seconds_count[5m]))`,
    notes: "This is a direct bucket ratio, not a quantile. histogram_quantile(0.97, ...) returns the 97th percentile duration instead.",
  },
  {
    id: "probe",
    title: "Blackbox Probe",
    goal: "probe_success and probe_duration_seconds.",
    hint: "instance = target probe URL; job = blackbox-http.",
    query: "probe_success",
    notes: "Relabeling: __address__ → __param_target, then __address__ = blackbox:9115. Otherwise Prometheus scrapes Blackbox Exporter itself rather than probing the target.",
  },
  {
    id: "push",
    title: "Is Pushgateway Fresh?",
    goal: "Calculate the age of the last success with timestamp().",
    hint: "Without honor_labels: true, the job label would be overwritten with job=pushgateway.",
    query: "time() - timestamp(batch_job_last_success_timestamp_seconds)",
    notes: "Should stay within a few seconds (loadgen pushes every 1s). Stale series disappear after ~5 minutes.",
  },
  {
    id: "recording",
    title: "Recording Rule",
    goal: "Precomputed metric job:http_request_error_ratio:rate5m.",
    hint: "Naming format: level:metric:operations.",
    query: "job:http_request_error_ratio:rate5m",
    notes: "Recording rules are evaluated at evaluation_interval. They speed up dashboards and simplify alert expressions.",
  },
  {
    id: "alerts",
    title: "Firing Alerts",
    goal: "Query ALERTS{alertstate=\"firing\"} or ALERTS_FOR_STATE.",
    hint: "Prometheus UI → Alerts tab displays the same rule states.",
    query: `ALERTS{alertstate="firing"}`,
    notes: "Alert remains in 'pending' state before 'for: 1m' elapses. Alertmanager grouping is separate — in Prometheus each series is an individual alert.",
  },
  {
    id: "node",
    title: "Node CPU (Non-idle)",
    goal: "Calculate rate for mode!=\"idle\" and aggregate per instance.",
    hint: "node_cpu_seconds_total is a counter.",
    query: `sum by (instance) (rate(node_cpu_seconds_total{mode!="idle"}[5m]))`,
    notes: "Reflects the Podman WSL machine's CPU rather than all Windows host cores. Sufficient for PCA practice.",
  },
  {
    id: "topk",
    title: "Noisiest Endpoint",
    goal: "topk / bottomk require an instant vector.",
    hint: "Calculate rate first, then apply topk.",
    query: "topk(3, sum by (endpoint) (rate(http_requests_total[5m])))",
    notes: "topk(3, metric[5m]) is invalid — it takes a range vector. count by (code) (http_requests_total) counts dimensions.",
  },
  {
    id: "irate",
    title: "irate vs rate",
    goal: "Same counter, two different functions. irate uses the last two points; rate averages over the window.",
    hint: "irate appears much more jagged on graphs.",
    query: `rate(http_requests_total[5m])
irate(http_requests_total[2m])`,
    notes: "rate() is the standard default for dashboards and alerts. irate() captures brief spikes and is too noisy for alerting.",
  },
  {
    id: "over-time",
    title: "Aggregation Over Time",
    goal: "avg_over_time takes a range vector; avg by aggregates across dimensions.",
    hint: "app_queue_depth is a gauge.",
    query: "avg_over_time(app_queue_depth[10m])",
    notes: "max_over_time / min_over_time belong to the same family. avg by (instance) (app_queue_depth) collapses instant vectors across dimensions.",
  },
  {
    id: "deriv",
    title: "Gauge Derivative",
    goal: "deriv / delta apply to gauges, not counters.",
    hint: "Temperature fluctuates up and down.",
    query: "deriv(app_cpu_temp_celsius[5m])",
    notes: "delta() computes the difference between window start and end. rate() is invalid here — gauges do not have counter reset semantics.",
  },
  {
    id: "absent",
    title: "absent vs up==0",
    goal: "If target is completely absent, absent() returns 1. up==0 means target is configured but scrape failed.",
    hint: "Use a non-existent job name.",
    query: `absent(up{job="does-not-exist"})
up == 0`,
    notes: "Exam trap: a deleted scrape job is absent; a down instance has up==0 (the series exists).",
  },
  {
    id: "unless",
    title: "unless / and",
    goal: "Set operators work via label matching.",
    hint: "Queue depth of instances where up==1.",
    query: "app_queue_depth and on(instance) (up == 1)",
    notes: "unless drops matching labels. or performs a union. ignoring(code) ignores the code label in binary divisions.",
  },
  {
    id: "group-left",
    title: "Copy Labels with group_left",
    goal: "many-to-one: attach job label from the right to multiple series on the left.",
    hint: "Match on instance with on(instance), and take job from the right with group_left(job).",
    query: `rate(http_requests_total[5m])
  * on(instance) group_left(job)
  up`,
    notes: "group_right is the reverse. Non-matching label sets return an empty result — ignoring/on is essential.",
  },
];
