export type Finding = {
  severity: "keep" | "fix" | "next";
  title: string;
  detail: string;
};

export const findings: Finding[] = [
  {
    severity: "keep",
    title: "Stack covers the PCA curriculum",
    detail:
      "The 8 running containers (Prometheus, Grafana, Alertmanager, Node Exporter, Blackbox, Pushgateway, sample-app, loadgen) map directly to the exam's five domains. An i9 + 32 GB laptop with ~16 GB / 20 CPUs allocated to the Podman machine is more than sufficient for this lab.",
  },
  {
    severity: "keep",
    title: "Rootful WSL Podman is the right choice",
    detail:
      "Node Exporter host pid and /proc, /sys mounts function properly on a rootful machine. kubectl 1.37 and Kind are installed; ready for Kubernetes SD.",
  },
  {
    severity: "fix",
    title: "Pin :latest image tags",
    detail:
      "prom/prometheus:latest and grafana/grafana:latest were previously used. To prevent metric names and UI changes during exam study, this repo pins versions such as v2.55.1 and Grafana 11.5.2.",
  },
  {
    severity: "fix",
    title: "Persist rules, relabeling, and SD into files",
    detail:
      "Even with Compose running, PCA primarily tests YAML configurations: recording + alerting rules, Alertmanager group_by / inhibit, blackbox relabel_configs, file_sd, and honor_labels. This lab provides them ready out-of-the-box.",
  },
  {
    severity: "fix",
    title: "Align histogram buckets with SLOs",
    detail:
      "For exam questions such as '97% of uploads complete within 30s', the bucket list must include the exact threshold of 30. The sample-app upload_duration_seconds buckets are configured as 10, 25, 27, 30, 32, 35, 40, 50.",
  },
  {
    severity: "next",
    title: "Kind cluster not yet created — next step",
    detail:
      "In Podman Desktop, Kind is on 'Create new…'. The first phase is Compose. A kubernetes_sd_configs example is in lab/prometheus/examples/kubernetes-sd.yml; cluster setup instructions are in k8s/.",
  },
];

export const hardwareNotes = {
  cpu: "20 vCPUs allocated (i9)",
  memory: "16.61 GB / 32 GB",
  disk: "1.08 TB Podman disk",
  engine: "Podman 5.x, rootful WSL, Podman Desktop 1.29.3",
};
