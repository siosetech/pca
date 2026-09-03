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
    title: "Grafana heatmap",
    why: "Sınav tuzağı: heatmap Histogram ister, Summary değil.",
    body: "Overview dashboard’a latency heatmap eklendi. Grafana → PCA Lab Overview, en alt panel. Veri: http_request_duration_seconds_bucket. Summary quantile’leri heatmap’e birleştirilemez.",
  },
  {
    id: "metric-relabel",
    pearson: "L3 Installing / scrape config",
    title: "metric_relabel_configs (canlı)",
    why: "relabel hedefi seçer; metric_relabel scrape’ten sonra seriyi düşürür.",
    body: "prometheus job’unda go_.* drop ediliyor. Status → Targets aynı kalır; Graph’ta go_goroutines artık bu job’dan gelmez. Relabel aksiyonları: keep, drop, replace, labelmap, labeldrop, labelkeep — örnek YAML lab/prometheus/examples/relabel-actions.yml.",
    query: `{job="prometheus",__name__=~"go_.*"}`,
  },
  {
    id: "promql-plus",
    pearson: "L5 Querying (23m) vs L9 PromQL (1h41m)",
    title: "PromQL extras",
    why: "Videodaki kısa ‘querying’ dersi sınavın %28’ini karşılamaz.",
    body: "PromQL sayfasına irate, avg_over_time, deriv, absent, unless/and, group_left alıştırmaları eklendi. Hepsini Expression browser’da çalıştır (http://localhost:9090).",
  },
  {
    id: "linux",
    pearson: "L11 Monitoring Linux",
    title: "Node Exporter sorguları",
    why: "Host metrikleri: CPU, bellek, disk, network. Windows host değil, Podman WSL makinesi.",
    body: "node-exporter :9100. USE: Utilization / Saturation / Errors. Disk space için node_filesystem_avail_bytes; bellek node_memory_MemAvailable_bytes.",
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
    title: "kubernetes_sd rolleri",
    why: "Kind şart değil; sınav YAML’i tanıtmanı ister.",
    body: "Roller: node, pod, service, endpoints, ingress. Klasik keep: annotation prometheus.io/scrape=true. Örnekler lab/prometheus/examples/kubernetes-sd.yml ve kubernetes-sd-roles.yml. Cluster istersen k8s/README.md.",
  },
  {
    id: "traps",
    pearson: "L13 Exam prep",
    title: "Sınav tuzakları",
    why: "KodeKloud bitince sürpriz olan maddeler.",
    body: "TSDB: ext4/XFS, NFS değil. Router: SNMP exporter. Üç sütun: metrics≠logs≠traces. Pushgateway sadece kısa job. honor_labels Pushgateway’de. job+instance varsayılan etiketler. AM Reload butonu yok. continue: false = ilk eşleşen route. Silences AM UI. Cardinality: user_id label yasak. Liste: drills/exam-traps.md.",
  },
  {
    id: "am-ui",
    pearson: "L8 Alerting",
    title: "Alertmanager UI turu",
    why: "Routing dosyada var; sınav silences / inhibit / grouping saydırır.",
    body: "http://localhost:9093 → Alerts, Silences. HighErrorRate kasıtlı 5xx ile gelir. InstanceDown ateşlenirse inhibit HighErrorRate’i aynı instance’da keser. Silence: UI’dan alertname=HighErrorRate, 15 dk. continue: true kardeş route’lara da gider (şu an critical’de false).",
  },
  {
    id: "slo",
    pearson: "L4 Observability",
    title: "SLI / SLO / SLA",
    why: "Lab kovası 30s; üçlü ayrımı ezber.",
    body: "SLI = ölçtüğün oran (upload ≤ 30s). SLO = hedef (97%). SLA = müşteri sözleşmesi, genelde SLO’dan gevşek. histogram_quantile SLO eşiğinde kova yoksa kördür.",
    query: `sum(rate(upload_duration_seconds_bucket{le="30"}[5m]))
/
sum(rate(upload_duration_seconds_count[5m]))`,
  },
];
