import { CopyBlock } from "@/components/copy-block";

const blocks = [
  {
    title: "Selectors",
    code: `{job="node"}
{job=~"web|node"}
{code=~"5.."}
{instance!="localhost:9090"}`,
  },
  {
    title: "Rate Family",
    code: `rate(http_requests_total[5m])
irate(http_requests_total[5m])
increase(http_requests_total[1h])
deriv(app_queue_depth[5m])   # gauge only`,
  },
  {
    title: "Aggregation",
    code: `sum by (code) (rate(http_requests_total[5m]))
avg by (instance) (app_cpu_temp_celsius)
avg_over_time(app_queue_depth[15m])
topk(3, sum by (endpoint) (rate(http_requests_total[5m])))`,
  },
  {
    title: "Histogram & SLO",
    code: `histogram_quantile(0.99, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))
sum(rate(upload_duration_seconds_bucket{le="30"}[5m]))
/
sum(rate(upload_duration_seconds_count[5m]))`,
  },
  {
    title: "Relabel vs metric relabel",
    code: `# drop targets before scrape
relabel_configs:
  - source_labels: [team]
    regex: frontend
    action: drop

# rename/drop series after scrape
metric_relabel_configs:
  - source_labels: [__name__]
    regex: go_.*
    action: drop`,
  },
  {
    title: "Alertmanager timing",
    code: `group_wait:      first notification delay
group_interval:  wait before more alerts in the same group
repeat_interval: resend if still firing (the "ignored alert" question)`,
  },
  {
    title: "Metric types",
    code: `Counter   *_total          requests, bytes — use rate()
Gauge                      temp, queue, up, in-flight
Histogram *_bucket/sum/count   latency, heatmap, quantile
Summary   client quantile  not aggregatable across instances`,
  },
  {
    title: "Reload",
    code: `curl -X POST http://localhost:9090/-/reload
curl -X POST http://localhost:9093/-/reload
# or SIGHUP / restart. No "Reload" button in Alertmanager UI.`,
  },
  {
    title: "absent vs up",
    code: `up == 0                 # target exists, scrape failed
absent(up{job="gone"})  # job not configured — no series`,
  },
  {
    title: "kubernetes_sd roles",
    code: `role: node | pod | service | endpoints | ingress
keep pods: prometheus.io/scrape=true annotation`,
  },
  {
    title: "Limitations (exam traps)",
    code: `TSDB: ext4/XFS, not NFS
router: SNMP exporter
heatmap: Histogram, not Summary
HA: Prometheus is not clustered; remote_write for long-term`,
  },
];

export default function CheatsheetPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-medium tracking-tight">Cheatsheet</h1>
        <p className="text-muted-foreground">Closed-book patterns.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {blocks.map((b) => (
          <section key={b.title} className="space-y-2">
            <h2 className="text-sm font-medium">{b.title}</h2>
            <CopyBlock code={b.code} />
          </section>
        ))}
      </div>
    </div>
  );
}
