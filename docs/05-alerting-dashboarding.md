# 05 — Alerting and Dashboarding (18%)

> Mental model, and the line the exam draws hardest:
> **Prometheus decides *whether* an alert is firing. Alertmanager decides *who*
> hears about it, *bundled with what*, and *how often*.**
> Rules live in Prometheus. Routing, grouping, silencing, inhibition and
> notification live in Alertmanager.

```
rule_files ──► Prometheus evaluates every `evaluation_interval`
                 │  inactive ──(expr true)──► pending ──(true for `for`)──► firing
                 ▼
            HTTP POST to Alertmanager (repeated while firing)
                 │  dedupe → group → inhibit → silence → route → notify
                 ▼
            email / Slack / PagerDuty / webhook
```

---

## 5.1 Recording rules

Precompute expensive or frequently-used expressions and store the result as a
new series. Evaluated every `evaluation_interval`.

```yaml
groups:
  - name: http.rules
    interval: 30s          # optional, overrides evaluation_interval
    rules:
      - record: job:http_requests:rate5m
        expr: sum by (job) (rate(http_requests_total[5m]))
        labels:
          tier: web
```

- **Naming convention:** `level:metric:operations` —
  `job:http_requests:rate5m`. The colons are what mark a metric as
  rule-generated (and why colons are banned in exposed metric names).
- Rules **inside one group run sequentially**, so a later rule can use an
  earlier rule's output. Different groups run **in parallel** — never depend
  across groups.
- Use them for: dashboard queries that are slow, subqueries, and the inputs to
  alerting rules.

## 5.2 Alerting rules

```yaml
groups:
  - name: availability
    rules:
      - alert: InstanceDown
        expr: up == 0
        for: 5m                              # must stay true this long
        keep_firing_for: 0s                  # optional: linger after resolving
        labels:
          severity: critical                 # used by Alertmanager routing
        annotations:
          summary: "{{ $labels.instance }} is down"
          description: "{{ $labels.job }}/{{ $labels.instance }} has been down for 5m."
          runbook_url: "https://runbooks.internal/instance-down"
```

**The state machine** — memorise it:

| State | Meaning |
|---|---|
| **inactive** | The expression returns nothing for this label set |
| **pending** | Expression is true, but `for` hasn't elapsed yet. **Not sent to Alertmanager** |
| **firing** | True continuously for at least `for`. Sent to Alertmanager |

- `for` exists to filter out flapping. Without it, one bad scrape pages someone.
- **Each series returned by `expr` becomes its own alert instance**, identified
  by its labels plus the `alertname` label.
- Prometheus exposes `ALERTS{alertname, alertstate, ...}` and
  `ALERTS_FOR_STATE`, so you can query your own alerts.
- `labels` are for **routing** (machine-readable); `annotations` are for
  **humans** and support Go templating: `{{ $labels.x }}`, `{{ $value }}`,
  `{{ humanize $value }}`, `{{ $value | printf "%.2f" }}`.
- Prometheus **re-sends** firing alerts to Alertmanager continuously
  (`--rules.alert.resend-delay`, default 1m); Alertmanager handles repetition.
- Validate with `promtool check rules`, and unit-test with `promtool test rules`.

## 5.3 Alertmanager

```yaml
global:
  resolve_timeout: 5m

route:                                  # the root of the routing TREE
  receiver: default
  group_by: ["alertname", "cluster"]
  group_wait: 30s                       # wait before sending the FIRST notification for a new group
  group_interval: 5m                    # wait before sending an UPDATE to an existing group
  repeat_interval: 4h                   # wait before re-sending an UNCHANGED alert
  routes:
    - matchers: ['severity="critical"']
      receiver: pager
      continue: false                   # stop at the first matching child (default)
    - matchers: ['team="db"']
      receiver: db-team

inhibit_rules:
  - source_matchers: ['severity="critical"']
    target_matchers: ['severity="warning"']
    equal: ["alertname", "instance"]    # only inhibit when these labels match

receivers:
  - name: default
  - name: pager
    webhook_configs: [{ url: "http://example/hook" }]
```

### The four concepts

| Concept | What it does |
|---|---|
| **Grouping** | Bundle related alerts into one notification. 100 pods down = 1 message, not 100 |
| **Inhibition** | Suppress alert B while alert A is firing. "Cluster down" mutes "pod unreachable" |
| **Silencing** | Manually mute matching alerts for a window. Set in the UI or with `amtool`. Used for maintenance |
| **Deduplication** | Identical alerts from HA Prometheus replicas collapse into one |

> The three timers get confused constantly. Say them as a sentence:
> **`group_wait`** — a new group just appeared, hold on briefly in case friends
> arrive. **`group_interval`** — this group already notified, and now something
> *changed*; wait this long before the update. **`repeat_interval`** — nothing
> changed and it's still broken; nag again after this long.

Routing is a **tree**, matched depth-first. A child route inherits its parent's
settings unless it overrides them. `continue: true` on a child lets matching
carry on to its siblings — that's how you send one alert to two receivers.

Other bits:
- Receivers: `email_configs`, `slack_configs`, `pagerduty_configs`,
  `opsgenie_configs`, `webhook_configs`, `victorops_configs`, `telegram_configs`, …
- `mute_time_intervals` / `active_time_intervals` — don't page outside business hours.
- **Alertmanager clusters** (gossip, `--cluster.peer`) for HA. Prometheus servers
  should each point at **all** Alertmanager peers; the cluster dedupes.
- `amtool check-config`, `amtool alert query`, `amtool silence add`.

## 5.4 Dashboarding

**Grafana is not part of Prometheus** — it's the de facto visualisation layer.

- Add Prometheus as a **datasource** (URL, scrape/`$__interval` handling, auth).
- Provision datasources and dashboards as **YAML/JSON files** so they live in
  git — that's what `lab/grafana/provisioning/` does.
- **Template variables** turn one dashboard into many:
  `label_values(up, instance)` builds a dropdown; use it as `{instance="$instance"}`.
- Grafana's `$__rate_interval` is the right range for `rate()` in a panel — it
  adapts to the zoom level and the datasource's scrape interval, avoiding the
  "too few samples" problem.
- Prometheus's own **expression browser** (`:9090/graph`) is for exploration and
  debugging, not for dashboards. Its `/alerts` page shows rule state, and
  `/targets` shows scrape health.
- Panel-design advice: dashboards should follow **USE or RED**, be readable in
  five seconds during an incident, and show the SLO line where one exists.

---

## Self-check

1. Draw the alert state machine and say what `for` does.
2. Which alert states are sent to Alertmanager?
3. `group_wait` vs `group_interval` vs `repeat_interval` — one sentence each.
4. Which of grouping / inhibition / silencing is automatic and which is manual?
5. Where does the `severity` label matter, and where do annotations matter?
6. Two rules in the same group; one uses the other's output. Legal? What if they're in different groups?
7. I want one alert to reach both the DB team and the pager. What do I set?
8. How do I mute everything on `host-7` for a two-hour maintenance window?
9. What does the recording-rule naming convention `level:metric:operations` mean?
10. Why does Prometheus keep re-sending a firing alert instead of sending it once?
