import { CopyBlock } from "@/components/copy-block";
import { labServices } from "@/lib/data/services";

const steps = [
  <>Targets — all UP. Expand <span className="font-mono">file-sd</span> and <span className="font-mono">blackbox-http</span>.</>,
  <>Graph — <span className="font-mono">rate(http_requests_total[5m])</span> and <span className="font-mono">job:http_request_error_ratio:rate5m</span>.</>,
  <>Alert — HighErrorRate. <span className="font-mono">/api/unstable</span> ≈ 28% 500s.</>,
  <>Alertmanager — group_by, inhibit. Watch <span className="font-mono">alertmanager_webhooks_total</span>.</>,
  <>Grafana — <span className="font-mono">admin / pca</span>, dashboard PCA Lab Overview.</>,
  <>Pushgateway — <span className="font-mono">time() - timestamp(batch_job_last_success_timestamp_seconds)</span>.</>,
  <>Reload — <span className="font-mono">curl -X POST http://localhost:9090/-/reload</span>.</>,
];

export default function LabPage() {
  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-medium tracking-tight">Lab</h1>
        <p className="text-muted-foreground">8-container Podman stack. Machine must be running.</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Start</h2>
        <CopyBlock
          code={`cd lab
podman compose up -d --build`}
        />
        <p className="text-sm text-muted-foreground">
          Stop with <span className="font-mono text-foreground">podman compose down</span>
          <span className="mx-2 text-border">·</span>
          Grafana <span className="font-mono text-foreground">admin / pca</span>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Services</h2>
        <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
          <table className="w-full text-sm">
            <tbody>
              {labServices.map((s) => (
                <tr key={s.id} className="border-t border-border/60 first:border-t-0">
                  <td className="px-4 py-2.5 font-medium">{s.name}</td>
                  <td className="hidden px-4 py-2.5 font-mono text-muted-foreground md:table-cell">
                    {s.image}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {s.url && s.port ? (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono tabular-nums text-muted-foreground hover:text-primary"
                      >
                        :{s.port}
                      </a>
                    ) : (
                      <span className="font-mono text-muted-foreground">internal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Walkthrough</h2>
        <ol className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
          {steps.map((step, i) => (
            <li
              key={i}
              className="flex gap-3 bg-card px-4 py-2.5 text-sm leading-relaxed not-first:border-t not-first:border-border/60"
            >
              <span className="font-mono tabular-nums text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Kind</h2>
        <CopyBlock
          code={`$env:KIND_EXPERIMENTAL_PROVIDER = "podman"
kind create cluster --config k8s/kind-cluster.yaml`}
        />
      </section>
    </div>
  );
}
