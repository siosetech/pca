# The lab

A single-node Prometheus stack that runs on the laptop under Podman. Its job is
to make everything in `docs/` reproducible: every fact in the notes should have
a query, a config block or an alert here that demonstrates it.

## What's in it

| Service | Port | Why it's here |
|---|---:|---|
| **prometheus** | 9090 | The thing being studied |
| **alertmanager** | 9093 | Grouping, inhibition, silences, routing |
| **grafana** | 3000 | Dashboarding domain. `admin` / `admin`, anonymous access on |
| **node-exporter** | 9100 | Host metrics — the USE method, `node_cpu_seconds_total` |
| **blackbox** | 9115 | Black-box probing + the `__param_target` relabel dance |
| **pushgateway** | 9091 | Batch-job metrics and their caveats |
| **sample-app** | 8000 | One of each metric type: counter, gauge, histogram, summary |
| **loadgen** | — | Curl loop, so the counters and histograms actually have data |

## Bring it up

```powershell
cd D:\dev\workspace\pca\lab
podman compose up -d          # first run builds the sample app image
podman compose ps
```

Then open, in this order:

1. http://localhost:9090/targets — everything should be `UP` within ~30s
   (`blackbox-icmp` may fail if the Podman machine can't send ICMP; that's fine,
   it makes a nice `probe_success == 0` alert to look at)
2. http://localhost:9090/graph — type `up` and press Execute
3. http://localhost:8000/metrics — read the raw exposition format
4. http://localhost:9090/alerts — watch alerts go inactive → pending → firing
5. http://localhost:3000 — the provisioned **PCA Lab** dashboard

## Tear it down

```powershell
podman compose down            # keep the TSDB data
podman compose down -v         # also delete the volumes and start clean
```

## Everyday commands

```powershell
podman compose logs -f prometheus
podman compose restart prometheus
podman compose up -d --build sample-app        # after editing app.py

# Reload config without restarting (--web.enable-lifecycle is on)
curl.exe -X POST http://localhost:9090/-/reload

# Validate before reloading — do this every single time
podman run --rm -v .\prometheus:/etc/prometheus:ro docker.io/prom/prometheus:latest `
  promtool check config /etc/prometheus/prometheus.yml

podman run --rm -v .\prometheus\rules:/rules:ro docker.io/prom/prometheus:latest `
  promtool check rules /rules/alerts.rules.yml /rules/recording.rules.yml

podman run --rm -v .\alertmanager:/etc/alertmanager:ro docker.io/prom/alertmanager:latest `
  amtool check-config /etc/alertmanager/alertmanager.yml
```

## Exercises the lab is built for

These are the things worth actually *doing*, in rough order of exam value:

1. **Break a target.** `podman compose stop sample-app`. Watch `up` go to 0,
   the `TargetDown` alert go pending then firing, and the alert arrive in
   Alertmanager. Then watch `TargetMissing` (via `absent()`) *not* fire, because
   the target still exists in service discovery — and understand why that
   distinction matters.
2. **Add a target with file_sd.** Edit `prometheus/targets/node.yml`, add
   `pushgateway:9091`, and watch it appear on `/targets` **without a reload**.
3. **Drop a metric.** Add a rule to `metric_relabel_configs` that drops
   `go_*` from the sample app. Confirm it's gone from the TSDB but still
   present at `http://localhost:8000/metrics` — that's the difference between
   the two relabel stages, made visible.
4. **Push a batch metric.**
   ```powershell
   "backup_last_success_timestamp_seconds $([int64](Get-Date -UFormat %s))" | `
     curl.exe --data-binary "@-" http://localhost:9091/metrics/job/nightly_backup
   ```
   Query `time() - backup_last_success_timestamp_seconds`, then delete the group
   and notice the metric had to be deleted *explicitly*.
5. **Silence an alert** in the Alertmanager UI and watch it stop notifying while
   still firing in Prometheus. That split is the whole point of Alertmanager.
6. **Test inhibition.** Make a critical and a warning alert fire on the same
   `instance` and confirm the warning is suppressed.
7. **Rewrite the dashboard panels from memory** rather than copying them.
8. **Unit-test an alerting rule** with `promtool test rules` — the best way to
   really internalise the `for` clause.

## Troubleshooting on Windows + Podman

### The Podman machine must be rootless, or no port reaches Windows

**Symptom:** every container is `RUNNING`, `podman ps` shows `0.0.0.0:9090->9090/tcp`,
and yet the browser gives `ERR_CONNECTION_REFUSED` on *every single port* — 9090,
3000, 8000, all of them. Cost me an evening on 2026-09-02.

**Why.** WSL2 forwards ports to Windows by watching the distro for **listening
sockets** and mirroring them onto Windows `localhost`. It can only mirror what it
can see.

- A **rootful** machine publishes ports with kernel DNAT rules. Packets are
  rewritten in the firewall layer and *no process ever opens a socket*. WSL looks
  in, sees no listener, mirrors nothing. Inside the machine everything works,
  because DNAT applies there — from Windows there is no door to knock on.
- A **rootless** machine can't touch iptables, so it starts a helper process,
  `rootlessport`, that genuinely binds `0.0.0.0:9090` and proxies into the
  container. WSL sees a real socket and mirrors it.

The less-privileged mode works precisely *because* it can't use the privileged
shortcut.

**Diagnose it in three commands.** Each one splits the problem:

```powershell
podman ps --format "{{.Names}} -> {{.Ports}}"                 # 1. did the ports get published?
netstat -ano | findstr ":9090 "                               # 2. is Windows listening?  (keep the trailing
                                                              #    space — "3000" also matches 30000)
podman machine ssh "curl -s -o /dev/null -w '%{http_code}\n' http://localhost:9090/-/healthy"   # 3. alive inside?
```

| 1 | 2 | 3 | Diagnosis |
|---|---|---|---|
| mapping shown | nothing | `200` | **This bug.** Machine is rootful — switch it |
| no mapping | nothing | — | Compose never published the ports |
| mapping shown | `LISTENING` | `200` | Windows Firewall is rejecting loopback |
| mapping shown | — | fails | The container itself isn't serving — read its logs |

**The fix:**

```powershell
podman compose -f lab\compose.yaml down
podman machine stop
podman machine set --rootful=false
podman machine start
podman compose -f lab\compose.yaml up -d
```

Rootless has its own image and volume storage, so everything re-pulls once —
a couple of minutes. Confirm with:

```powershell
podman machine ssh "ss -tlnp | grep -E ':(9090|3000|8000)'"   # must list rootlessport
curl.exe http://localhost:9090/-/healthy                      # Prometheus Server is Healthy.
```

Nothing in this lab needs rootful. node-exporter reads `/proc` and `/sys`
read-only and works fine rootless; a couple of its collectors may log permission
warnings, which is harmless here.

### Everything else

| Symptom | Fix |
|---|---|
| `podman compose` says the provider is missing | Podman Desktop ships a compose provider; otherwise `pip install podman-compose`, or use `podman-compose` directly |
| Bind mounts from `D:\` fail or come up empty | The Podman machine is a WSL distro — check `/mnt/d` exists inside it (`podman machine ssh`). If not, move the repo under `C:\Users\<you>\` |
| Config edits don't take effect | Bind mounts are `:ro` but Prometheus still needs a reload: `curl.exe -X POST http://localhost:9090/-/reload` |
| `blackbox-icmp` targets down | ICMP from a rootless container is usually blocked. Expected; leave it as a broken target to study |
| node-exporter shows the VM, not Windows | Correct — it's reporting the Podman machine's Linux kernel. Fine for learning |
| Ports already in use | `netstat -ano \| findstr ":9090 "`, or change the host side of the port mapping |
| Provisioned dashboard not on the Grafana home page | It isn't "recent" until you open it — **Dashboards → PCA Lab** |
| Sample app image won't build | `podman compose build --no-cache sample-app` and read the pip output |
