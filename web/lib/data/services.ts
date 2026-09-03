export type LabService = {
  id: string;
  name: string;
  image: string;
  port: number | null;
  url?: string;
  exam: string;
  role: string;
};

export const labServices: LabService[] = [
  {
    id: "prometheus",
    name: "Prometheus",
    image: "prom/prometheus:v2.55.1",
    port: 9090,
    url: "http://localhost:9090",
    exam: "Fundamentals + PromQL",
    role: "Pulls targets, stores TSDB, evaluates rules, serves PromQL.",
  },
  {
    id: "grafana",
    name: "Grafana",
    image: "grafana/grafana:11.5.2",
    port: 3000,
    url: "http://localhost:3000",
    exam: "Alerting & Dashboarding",
    role: "Provisioned dashboards on the Prometheus datasource. Login admin / pca.",
  },
  {
    id: "alertmanager",
    name: "Alertmanager",
    image: "prom/alertmanager:v0.27.0",
    port: 9093,
    url: "http://localhost:9093",
    exam: "Alerting & Dashboarding",
    role: "Groups, inhibits, and routes firing alerts to the sample-app webhook.",
  },
  {
    id: "sample-app",
    name: "Sample shop",
    image: "localhost/pca-sample-app:latest",
    port: 8000,
    url: "http://localhost:8000",
    exam: "Instrumentation",
    role: "Python client library: Counter, Gauge, Histogram, Summary + /metrics.",
  },
  {
    id: "node-exporter",
    name: "Node Exporter",
    image: "prom/node-exporter:v1.8.2",
    port: 9100,
    url: "http://localhost:9100/metrics",
    exam: "Exporters",
    role: "Host CPU, memory, disk, and network metrics from the Podman machine.",
  },
  {
    id: "blackbox",
    name: "Blackbox Exporter",
    image: "prom/blackbox-exporter:v0.25.0",
    port: 9115,
    url: "http://localhost:9115",
    exam: "Exporters + probe relabeling",
    role: "HTTP probes of /health endpoints. Prometheus rewrites the target via relabel_configs.",
  },
  {
    id: "pushgateway",
    name: "Pushgateway",
    image: "prom/pushgateway:v1.10.0",
    port: 9091,
    url: "http://localhost:9091",
    exam: "Push vs Pull",
    role: "Receives metrics from the short-lived loadgen batch job. honor_labels: true.",
  },
  {
    id: "loadgen",
    name: "Loadgen",
    image: "curlimages/curl:8.12.1",
    port: null,
    exam: "Makes the graphs move",
    role: "Hits the shop API every second and pushes batch_job_* to Pushgateway.",
  },
];
