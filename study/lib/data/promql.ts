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
    title: "Hangi hedefler ayakta?",
    goal: "Scrape başarısını gör. up 1 = scrape OK, 0 = fail (seri yine vardır).",
    hint: "Prometheus her job için up üretir.",
    query: "up",
    notes: "absent(up{job=\"sample-app\"}) hedef hiç yoksa 1 döner. up==0 ise hedef tanımlı ama cevap vermiyor.",
  },
  {
    id: "rate",
    title: "İstek hızı (RPS)",
    goal: "Counter’ı grafikte kullanmadan önce rate() al.",
    hint: "5m pencere, lab scrape 15s — pencerede birkaç örnek olsun.",
    query: "sum by (code) (rate(http_requests_total[5m]))",
    notes: "increase(http_requests_total[5m]) aynı penceredeki toplam artış. irate() son iki örnek, alerting’de gürültülü.",
  },
  {
    id: "errors",
    title: "5xx oranı",
    goal: "Error ratio: 5xx / tüm istekler. Binary op aynı etiketlerle eşleşmeli.",
    hint: "code etiketini ignoring veya ayrı sum ile yok et.",
    query: `sum(rate(http_requests_total{code=~"5.."}[5m]))
/
sum(rate(http_requests_total[5m]))`,
    notes: "Lab /api/unstable ~28% 500 üretir; HighErrorRate uyarısı 5% eşiğinde ateşlenir.",
  },
  {
    id: "p99",
    title: "p99 latency",
    goal: "histogram_quantile + rate + sum by (le).",
    hint: "le etiketini düşürme.",
    query: `histogram_quantile(
  0.99,
  sum by (le, endpoint) (rate(http_request_duration_seconds_bucket[5m]))
)`,
    notes: "φ 0 ile 1 arası. Histogram kovaları sample-app’te 5ms…5s.",
  },
  {
    id: "avg-cpu",
    title: "CPU başına değil, instance ortalaması",
    goal: "Boyut üzerinde avg by.",
    hint: "app_cpu_temp_celsius{cpu=\"0|1\"} sample-app’te simüle.",
    query: "avg by (instance) (app_cpu_temp_celsius)",
    notes: "Sınav klasiği: avg by (instance) (node_cpu_temp_celsius). rate() gauge’a uygulanmaz.",
  },
  {
    id: "slo",
    title: "Upload SLO: 97% < 30s",
    goal: "Kova 30s’de. 30s’den yavaş olmayan oranı tahmin et.",
    hint: "le=\"30\" kovası o süreye kadar olan gözlemler.",
    query: `sum(rate(upload_duration_seconds_bucket{le="30"}[5m]))
/
sum(rate(upload_duration_seconds_count[5m]))`,
    notes: "Bu bir quantile değil, tam SLO eşiğindeki kova oranıdır. histogram_quantile(0.97, ...) 97. yüzdelik süreyi verir.",
  },
  {
    id: "probe",
    title: "Blackbox probe",
    goal: "probe_success ve probe_duration_seconds.",
    hint: "instance = tarama URL’si; job = blackbox-http.",
    query: "probe_success",
    notes: "Relabel: __address__ → __param_target, sonra __address__ = blackbox:9115. Aksi halde Prometheus blackbox’ın kendisini scrape eder, hedefi değil.",
  },
  {
    id: "push",
    title: "Pushgateway taze mi?",
    goal: "timestamp() ile last success yaşı.",
    hint: "honor_labels: true olmasa job=pushgateway olurdu.",
    query: "time() - timestamp(batch_job_last_success_timestamp_seconds)",
    notes: "Birkaç saniye olmalı (loadgen her 1s push eder). Stale series ~5 dakika sonra kaybolur.",
  },
  {
    id: "recording",
    title: "Recording rule",
    goal: "Önceden hesaplanmış job:http_request_error_ratio:rate5m.",
    hint: "Adlandırma: level:metric:operations.",
    query: "job:http_request_error_ratio:rate5m",
    notes: "Recording rules evaluation_interval’da çalışır. Dashboard’u ucuzlatır, alert expr’ını sadeleştirir.",
  },
  {
    id: "alerts",
    title: "Firing alert’ler",
    goal: "ALERTS{alertstate=\"firing\"} veya ALERTS_FOR_STATE.",
    hint: "Prometheus UI → Alerts sekmesi aynı kuralı gösterir.",
    query: `ALERTS{alertstate="firing"}`,
    notes: "for: 1m dolmadan state pending. Alertmanager grouping ayrı — Prometheus’ta her seri ayrı alert.",
  },
  {
    id: "node",
    title: "Node CPU (idle değil)",
    goal: "mode!=\"idle\" ile rate, instance bazında topla.",
    hint: "node_cpu_seconds_total bir counter.",
    query: `sum by (instance) (rate(node_cpu_seconds_total{mode!="idle"}[5m]))`,
    notes: "Podman WSL makinesinin CPU’su görünür, Windows host’un tüm çekirdekleri değil. PCA için yeterli.",
  },
  {
    id: "topk",
    title: "En gürültülü endpoint",
    goal: "topk / bottomk anlık vektör ister.",
    hint: "Önce rate, sonra topk.",
    query: "topk(3, sum by (endpoint) (rate(http_requests_total[5m])))",
    notes: "topk(3, metric[5m]) geçersiz — range vector. count by (code) (http_requests_total) boyut sayar.",
  },
  {
    id: "irate",
    title: "irate vs rate",
    goal: "Aynı counter, iki fonksiyon. irate son iki örnek, rate pencere ortalaması.",
    hint: "Grafikte irate daha dişli durur.",
    query: `rate(http_requests_total[5m])
irate(http_requests_total[2m])`,
    notes: "Dashboard ve alert’te rate() varsayılan. irate() kısa sıçramalar içindir, alerting’de gürültülü.",
  },
  {
    id: "over-time",
    title: "Zaman üzerinde ortalama",
    goal: "avg_over_time range vector ister; avg by boyut ister.",
    hint: "app_queue_depth bir gauge.",
    query: "avg_over_time(app_queue_depth[10m])",
    notes: "max_over_time / min_over_time aynı aile. avg by (instance) (app_queue_depth) anlık vektörü boyutlarda ezer.",
  },
  {
    id: "deriv",
    title: "Gauge türevi",
    goal: "deriv/delta counter’a değil gauge’a.",
    hint: "Sıcaklık inip çıkar.",
    query: "deriv(app_cpu_temp_celsius[5m])",
    notes: "delta() pencere başı-sonu farkı. rate() burada yanlış — counter reset semantiği yok.",
  },
  {
    id: "absent",
    title: "absent vs up==0",
    goal: "Hedef hiç yoksa absent=1. up==0 hedef tanımlı ama scrape fail.",
    hint: "Olmayan bir job adı kullan.",
    query: `absent(up{job="does-not-exist"})
up == 0`,
    notes: "Sınav tuzağı: silinmiş scrape job absent; down olan instance up==0 (seri durur).",
  },
  {
    id: "unless",
    title: "unless / and",
    goal: "Küme operatörleri etiket eşlemesiyle çalışır.",
    hint: "up==1 olan instance’ların kuyruk derinliği.",
    query: "app_queue_depth and on(instance) (up == 1)",
    notes: "unless eşleşen etiketleri düşürür. or birleşim. ignoring(code) binary bölmede code’u yok sayar.",
  },
  {
    id: "group-left",
    title: "group_left ile etiket kopyala",
    goal: "many-to-one: soldaki çok serinin sağına job ekle.",
    hint: "on(instance) eşle, group_left(job) sağdan job alsın.",
    query: `rate(http_requests_total[5m])
  * on(instance) group_left(job)
  up`,
    notes: "group_right tersi. Eşleşmeyen etiketler sonucu boş bırakır — ignoring/on şart.",
  },
];
