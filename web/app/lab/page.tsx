import { CopyBlock } from "@/components/copy-block";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { labServices } from "@/lib/data/services";

export default function LabPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-medium">Lab — Podman Compose</h1>
        <p className="max-w-2xl text-muted-foreground leading-relaxed">
          Windows + Podman Desktop. Compose file is in <code>lab\compose.yaml</code>.
          Grafana on 3000, Prometheus on 9090 — matching your local ports.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Start Lab</CardTitle>
          <CardDescription>
            Rootful Podman machine must be RUNNING (Settings → Resources).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <CopyBlock
            code={`cd D:\\dev\\workspace\\pca\\lab
podman compose up -d --build`}
          />
          <p className="text-sm text-muted-foreground">
            Initial image pull and sample-app build may take a few minutes.
            Stop previous stack if running:{" "}
            <code>podman compose down</code> (from the lab directory) to avoid port collisions.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {labServices.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>{s.name}</CardTitle>
                {s.port ? (
                  <Badge variant="secondary" className="font-mono">
                    :{s.port}
                  </Badge>
                ) : (
                  <Badge variant="outline">internal</Badge>
                )}
              </div>
              <CardDescription>{s.image}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{s.role}</p>
              <p className="text-muted-foreground">{s.exam}</p>
              {s.url ? (
                <a
                  className="text-primary underline-offset-4 hover:underline"
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {s.url}
                </a>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exam Walkthrough (30 min)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Prometheus → Status → Targets: All UP. Expand file-sd and blackbox-http
              jobs to verify relabeling results.
            </li>
            <li>
              In Graph: query <code>rate(http_requests_total[5m])</code> and{" "}
              <code>job:http_request_error_ratio:rate5m</code> (recording rule).
            </li>
            <li>
              Alerts: HighErrorRate pending/firing — /api/unstable intentionally generates
              ~28% 500 responses.
            </li>
            <li>
              Alertmanager: Inspect group_by and inhibit rules. Verify that sample-app{" "}
              <code>alertmanager_webhooks_total</code> increments.
            </li>
            <li>
              Grafana <code>admin / pca</code> — PCA Lab Overview. Compare time series
              graphs with p99 histogram_quantile.
            </li>
            <li>
              Pushgateway UI and{" "}
              <code>time() - timestamp(batch_job_last_success_timestamp_seconds)</code>.
            </li>
            <li>
              Config reload:{" "}
              <code>curl -X POST http://localhost:9090/-/reload</code>{" "}
              (--web.enable-lifecycle enabled).
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kind (Optional)</CardTitle>
          <CardDescription>
            kubernetes_sd_configs hands-on practice. Compose is sufficient; Kind is an optional next step.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CopyBlock
            code={`$env:KIND_EXPERIMENTAL_PROVIDER = "podman"
kind create cluster --config k8s/kind-cluster.yaml`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
