export type Finding = {
  severity: "keep" | "fix" | "next";
  title: string;
  detail: string;
};

export const findings: Finding[] = [
  {
    severity: "keep",
    title: "Stack PCA müfredatını karşılıyor",
    detail:
      "Çalışan 8 konteyner (Prometheus, Grafana, Alertmanager, Node Exporter, Blackbox, Pushgateway, sample-app, loadgen) sınavın beş alanına birebir oturuyor. i9 + 32 GB ve Podman makinesine ayrılmış ~16 GB / 20 CPU bu lab için fazla bile.",
  },
  {
    severity: "keep",
    title: "Rootful WSL Podman doğru tercih",
    detail:
      "Node Exporter host pid ve /proc,/sys bağları rootful makinede çalışır. kubectl 1.37 ve Kind kurulu; Kubernetes SD için hazır.",
  },
  {
    severity: "fix",
    title: ":latest etiketleri sabitle",
    detail:
      "Ekranda prom/prometheus:latest ve grafana/grafana:latest görünüyor. Sınav çalışırken metrik isimleri ve UI kaymasın diye bu repo v2.55.1 / Grafana 11.5.2 gibi pin’li imajlar kullanıyor.",
  },
  {
    severity: "fix",
    title: "Kuralları, relabel’i ve SD’yi dosyaya dök",
    detail:
      "Compose ayakta olsa da PCA asıl YAML’i sorar: recording + alerting rules, Alertmanager group_by / inhibit, blackbox relabel_configs, file_sd, honor_labels. Bu lab onları hazır getiriyor.",
  },
  {
    severity: "fix",
    title: "Histogram kovalarını SLO’ya hizala",
    detail:
      "Sınavda ‘97% of uploads complete within 30s’ tipi sorularda kova listesinde tam 30 değeri olması gerekir. sample-app upload_duration_seconds kovaları 10,25,27,30,32,35,40,50.",
  },
  {
    severity: "next",
    title: "Kind cluster henüz yok — sonra",
    detail:
      "Podman Desktop’ta Kind ‘Create new…’ olarak duruyor. İlk dilim compose. kubernetes_sd_configs örneği lab/prometheus/examples/kubernetes-sd.yml içinde; cluster tarifı k8s/ altında.",
  },
];

export const hardwareNotes = {
  cpu: "20 vCPU ayrılmış (i9)",
  memory: "16.61 GB / 32 GB",
  disk: "1.08 TB Podman disk",
  engine: "Podman 5.x, rootful WSL, Podman Desktop 1.29.3",
};
