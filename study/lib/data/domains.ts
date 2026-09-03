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
        heading: "Üç sütun",
        body: "Metrics: aggregatable numbers over time (Prometheus). Logs/events: discrete records, high cardinality, not Prometheus’s job (Loki, ELK). Traces: a request’s path as spans with a trace ID (Jaeger, Tempo, OTel). PCA ‘hangi araç hangi sinyal’ diye sorar — Prometheus metrik içindir.",
      },
      {
        heading: "Push vs Pull",
        body: "Prometheus varsayılanı pull’dur: scrape_interval’da HTTP GET /metrics. Avantaj: hedef ayaktaysa sen kontrol edersin, up metriği bedava gelir, stalled client yoktur. Pushgateway kısa ömürlü batch job’lar içindir (cron bitmeden scrape kaçmasın). Asıl uygulama metriklerini Pushgateway’e basmak anti-pattern’dir — stale metrik ve instance label kaybı.",
        exam: "Short-lived jobs → Pushgateway. Long-running services → scrape. honor_labels: true Pushgateway job’unda job/instance ezilmesin diye.",
      },
      {
        heading: "Service discovery",
        body: "Hedef listesini elle yazmak yerine file_sd, dns_sd, kubernetes_sd, consul_sd, ec2_sd. Lab’de file_sd 30 saniyede yeniden okunur. Kubernetes’te role: pod/service/endpoints/node/ingress ve __meta_kubernetes_* relabel alanları.",
      },
      {
        heading: "SLI, SLO, SLA",
        body: "SLI: ölçülen gösterge (ör. isteklerin 30 sn altında bitme oranı). SLO: hedef (97%). SLA: müşteri sözleşmesi, genelde SLO’dan gevşek, ihlalde cezası var. Histogram kovası SLO eşiğinde (30s) tanımlanmalı; yoksa quantile tahmini o noktada kördür.",
        exam: "Bucket listesinde SLO değeri yoksa histogram_quantile o SLI’yı güvenilir ölçmez.",
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
        heading: "Mimari",
        body: "Retrieval scrape eder, TSDB yerelde zaman serisi tutar, PromQL engine sorgular, HTTP UI/API sunar. Rule evaluator recording ve alerting kurallarını evaluation_interval’da çalıştırır. Alertmanager ayrı süreçtir; Prometheus alert gönderir, bildirim Alertmanager işidir. Grafana Prometheus’a sorgu atar, tersi değil.",
      },
      {
        heading: "Scrape ayarı",
        body: "global.scrape_interval varsayılan 1m; lab 15s. scrape_timeout < scrape_interval olmalı. Job her zaman job ve instance etiketini ekler (instance = host:port). metric_relabel_configs scrape’ten SONRA seriyi düşürür/yeniden adlandırır; relabel_configs hedef seçimi içindir (scrape etmeden drop).",
        exam: "team: frontend hedeflerini scrape etme → relabel_configs action: drop. Metrik adını değiştir → metric_relabel_configs.",
      },
      {
        heading: "Limitasyonlar",
        body: "Prometheus HA için tek kutu tasarlanmıştır (clustering yok; iki replica + external_labels). Uzun vadeli depolama için remote_write (Thanos, Mimir, Cortex). Yüksek kardinalite (user_id, email, uuid label) TSDB’yi öldürür. Network device’lar SNMP exporter ile izlenir; Prometheus router’a gitmez. Desteklenen yerel FS: ext4/XFS; NFS önerilmez.",
      },
      {
        heading: "Veri modeli",
        body: "Bir zaman serisi = metric name + label set. Örnek: http_requests_total{method=\"GET\",code=\"200\"} 12. Counter sadece artar (restart’ta 0’a düşebilir — rate() bunu handle eder). Gauge inip çıkar. Histogram _bucket/_sum/_count. Summary client-side quantile + _sum/_count.",
      },
      {
        heading: "Exposition format",
        body: "text/plain; version=0.0.4 OpenMetrics/Prometheus text. HELP ve TYPE satırları, sonra name{labels} value timestamp(opsiyonel). Histogram: le etiketi + +Inf kovası zorunlu. /metrics 200 dönmeli.",
      },
    ],
  },
  {
    slug: "promql",
    weight: 28,
    title: "PromQL",
    subtitle: "En ağır alan — rate, aggregation, binary ops, histograms",
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
        heading: "Seçiciler",
        body: "{job=\"node\"} eşitlik, {job!=\"node\"} değil, {job=~\"web|node\"} regex, {job!~\"dev.*\"} negatif regex. Instant vector vs range vector: metric[5m] range’dir ve tek başına grafiklenmez; üzerine rate/increase/avg_over_time gerekir.",
        exam: "job=web veya job=node → {job=~\"web|node\"}",
      },
      {
        heading: "rate, irate, increase",
        body: "rate(): range içinde per-second ortalama, counter reset’lerini düzeltir, grafikler için varsayılan. irate(): son iki örnek, ‘anlık’ sıçrama; alerting’de gürültülü. increase(): aynı pencerede toplam artış ≈ rate()*window_seconds. deriv() gauge’lar içindir, counter için değil.",
      },
      {
        heading: "Zaman vs boyut",
        body: "*_over_time (avg_over_time, max_over_time) range vector alır, zamanı sıkıştırır. sum/avg/max by (instance) instant vector alır, etiketleri sıkıştırır. ‘her node’da CPU’ların ortalaması’ → avg by (instance) (node_cpu_temp_celsius).",
      },
      {
        heading: "Binary operators ve eşleme",
        body: "A / B varsayılanı one-to-one, tüm etiketler eşit olmalı. ignoring(code) o etiketi yok sayar. on(instance) sadece o etiketten eşler. group_left / group_right many-to-one. and / or / unless küme operatörleri. > bool karşılaştırma 0/1 üretir.",
      },
      {
        heading: "Histogram",
        body: "histogram_quantile(0.99, sum by (le) (rate(http_request_duration_seconds_bucket[5m]))). le etiketini koru — by (le, ...) unutmak klasik hata. Histogram ≈ sunucu tarafı kova; Summary ≈ client quantile, aggregatable değil (farklı instance p99 toplanmaz).",
      },
      {
        heading: "Timestamp fonksiyonları",
        body: "time() unix now. timestamp(metric) serinin son örnek zamanı. time() - timestamp(batch_job_last_success_timestamp_seconds) ‘kaç saniyedir başarılı job gelmedi’. absent() seri yoksa 1 döner — up==0 ile karıştırma (up 0 da bir seridir).",
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
        heading: "Client libraries",
        body: "Resmi: Go, Java, Python, Ruby. Üçüncü parti: .NET, Node, Rust… Library üç iş yapar: metrik tut, /metrics expose et, kısa job’da Pushgateway’e push et. Lab sample-app Python prometheus_client kullanır.",
      },
      {
        heading: "Dört tip",
        body: "Counter: http_requests_total — asla azalmaz. Gauge: temperature, queue depth, in-flight. Histogram: latency/size dağılımı, heatmap ve quantile. Summary: client quantile; heatmap için histogram kullanılır (sınav tuzağı). Uptime’ı Counter ile ölç (process_start_time_seconds gauge + time()).",
        exam: "Heatmap → Histogram. ‘current temperature’ → Gauge. ‘requests since start’ → Counter.",
      },
      {
        heading: "İsimlendirme",
        body: "base_unit_suffix: http_request_duration_seconds, node_memory_MemAvailable_bytes. _total counter’larda. Uygulama adını metric name’e gömme, label kullan. Label’da user_id / email yasak (kardinalite). job ve instance’ı sen set etme; Prometheus ekler.",
      },
      {
        heading: "Exporters",
        body: "Node Exporter: *nix host. Windows Exporter. Blackbox: dışarıdan probe (HTTP/TCP/ICMP/DNS) — whitebox değil, blackbox. mysqld, redis, snmp, cadvisor. Kendi uygulamanı yazabiliyorsan exporter yerine client library.",
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
        heading: "Ne zaman alert",
        body: "Semptom (kullanıcı acı çekiyor: error ratio, latency, probe fail), neden değil (CPU 90%). Alert actionable olmalı. Recording rules dashboard ve kural için ön-aggregasyon. Alert rules ayrı YAML, rule_files ile yüklenir; scrape_configs içine yazılmaz.",
      },
      {
        heading: "Alerting rule",
        body: "alert: Name, expr:, for: (pending → firing), labels: (severity, team — routing için), annotations: (summary, description — $labels / $value). for: 1m scrape gürültüsünü keser. ALERTS ve ALERTS_FOR_STATE dahili serilerdir.",
      },
      {
        heading: "Alertmanager",
        body: "group_by benzer alert’leri tek bildiride toplar. group_wait ilk bildirimi geciktirir (kardeşler gelsin). group_interval aynı gruba ek bildirimi. repeat_interval kimse ack etmezse tekrar (sınav: ‘ne kadar bekler?’ → repeat_interval). inhibit_rules: InstanceDown varken HighErrorRate susturulur. Silences UI veya API. Config reload: SIGHUP, /- /reload, süreç restart — ‘UI’da reload butonu’ yoktur.",
        exam: "Routing tree ilk eşleşmede durur (continue: true değilse). matchers yeni sözdizimi; eski match: hâlâ görülebilir.",
      },
      {
        heading: "Dashboarding",
        body: "Grafana sınavın ürünü değil ama ‘hangi sorgu heatmap/graph/stat’ sorulur. Rate’ler graph. anlık up → stat. Histogram heatmap. RED: Rate, Errors, Duration. USE: Utilization, Saturation, Errors. Lab Grafana’da PCA Lab Overview provisioned gelir.",
      },
    ],
  },
];

export function getDomain(slug: string) {
  return domains.find((d) => d.slug === slug);
}
