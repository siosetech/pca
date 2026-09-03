# 01 — Observability Concepts (18%)

> Mental model: **monitoring answers questions you thought of in advance;
> observability lets you ask questions you didn't.** A dashboard of CPU graphs
> is monitoring. Being able to slice request latency by customer tier, region
> and build SHA — a question nobody wrote down before the incident — is
> observability. Prometheus is a monitoring system with enough dimensionality
> to buy you a lot of observability.

---

## 1.1 The three pillars

| Pillar | Answers | Cost shape | Prometheus? |
|---|---|---|---|
| **Metrics** | *Is something wrong, and how much?* | Cheap, fixed cost per series over time | Yes — this is Prometheus |
| **Logs** | *What exactly happened at 14:32?* | Cost grows with event volume | No — Loki / ELK |
| **Traces** | *Where in the call chain did the time go?* | Cost grows with request volume | No — Jaeger / Tempo |

The useful distinction: a metric is an **aggregate over time**, a log is a
**discrete event**, a trace is **one request's path across services**. Metrics
are the only one whose storage cost doesn't grow with traffic — that's why
they're the alerting layer.

> TODO: in my own words — when would I reach for a trace instead of a metric?

## 1.2 Logs and events

A **log** is a timestamped record of a discrete event. A **metric** is an
aggregate. That one difference drives every tradeoff between them.

| | Unstructured log | Structured log |
|---|---|---|
| Shape | `2026-09-03 00:14 ERROR payment failed for order 8821` | `{"ts":"...","level":"error","msg":"payment failed","order_id":8821}` |
| Queryable | grep, and hope | by field, reliably |
| Cost | cheap to write, expensive to search | slightly larger, far cheaper to query |

**Events** are the same idea with intent: a deliberate, machine-readable record
of something that happened (a deploy, a config change, a scaling action), often
carrying structured attributes rather than a human-readable sentence.

### Why logs are the wrong alerting substrate

Cost. A metric's storage is a fixed number of series regardless of traffic; a
log line is written *per event*. Ten times the traffic is ten times the log
bill, and log search latency grows with volume exactly when you need it fastest,
during an incident.

### Where logs win outright

- The exact error message and stack trace. A metric can tell you the error rate
  rose; only a log tells you it was a null pointer in the payment handler.
- Audit trails, where every individual record legally matters.
- Anything with unbounded identifiers, which is precisely what must **not**
  become a Prometheus label (see [cardinality](#18-cardinality)).

> Mental model: **metrics detect, logs diagnose, traces locate.** An incident
> usually runs in that order, and each signal hands off to the next.

Prometheus does not store logs, and it should not be made to. Log aggregation is
Loki, Elasticsearch/OpenSearch or Splunk's job.

## 1.3 Tracing and spans

A **trace** follows one request across every service it touches. It is made of
**spans**, and a span is one unit of work.

```
trace_id: 4bf92f...
  ├─ span: GET /checkout            120 ms   (root span, no parent)
  │   ├─ span: auth.verify           8 ms
  │   ├─ span: inventory.reserve    22 ms
  │   └─ span: payment.charge      86 ms
  │        └─ span: bank-api POST   74 ms   ← the actual culprit
```

Each span carries:

- a **trace ID**, shared by every span in the request
- a **span ID** of its own, and a **parent span ID** (the root span has none)
- a start timestamp and a duration
- **attributes** (tags): HTTP method, status, customer tier, whatever you set

**Context propagation** is what stitches them together: the trace and span IDs
travel between services in a request header, standardised by W3C as
`traceparent`. Without propagation you get disconnected spans, not a trace.

**Sampling** exists because keeping a trace for every request is unaffordable.
*Head-based* sampling decides at the start (keep 1%); *tail-based* decides after
the fact, which lets you keep all the slow or failed traces and throw away the
boring ones, at the cost of buffering.

**OpenTelemetry** is the vendor-neutral standard for producing traces (and
metrics and logs); Jaeger, Tempo and Zipkin store and display them.

### Where this touches Prometheus

**Exemplars.** An OpenMetrics exposition can attach a trace ID to a sample:

```
http_request_duration_seconds_bucket{le="1.0"} 214 # {trace_id="4bf92f..."} 0.94 1609746000
```

That lets you click a spike in a latency histogram and jump straight to a trace
of one request that caused it. It is the seam between the metric that detected
the problem and the trace that explains it.

## 1.4 Monitoring vs observability

- **Monitoring** — watching known failure modes. Predefined dashboards and alerts.
- **Observability** — a property of the system: can I infer internal state from
  external outputs? High-cardinality, dimensional data is what makes it possible.
- **Telemetry** — the data itself, and the act of shipping it.

## 1.5 Push vs pull

Prometheus **pulls** (scrapes) targets over HTTP. This is a real exam topic.

| | Pull (Prometheus) | Push (StatsD, Graphite) |
|---|---|---|
| Target liveness | Free — a failed scrape is an `up == 0` signal | Needs a separate heartbeat |
| Config lives | Centrally, in Prometheus | Distributed, in every app |
| Ad-hoc debugging | Just `curl` the `/metrics` endpoint yourself | Can't — data only flows out |
| Firewalls / NAT | Prometheus must reach the target | Target must reach the server |
| Short-lived jobs | Awkward — the job may die before a scrape | Natural fit |

The pull model's escape hatch for short-lived batch jobs is the **Pushgateway**
(see `docs/04`). It is an exception, not a general push endpoint.

> Mental model: pull means **the monitoring system holds the target list**. That
> single fact explains almost every pull-vs-push tradeoff above.

## 1.6 SLI, SLO, SLA, error budget

| Term | Definition | Example |
|---|---|---|
| **SLI** | Service Level *Indicator* — the measurement | ratio of HTTP requests served in < 300 ms |
| **SLO** | Service Level *Objective* — the internal target | 99.9% of requests < 300 ms over 30 days |
| **SLA** | Service Level *Agreement* — the contract, with penalties | 99.5% or the customer gets credits |
| **Error budget** | `100% − SLO`. How much failure you're allowed to spend | 99.9% ⇒ 0.1% ⇒ ~43 min/30 days |

The SLA is always looser than the SLO — you want to breach your own target
before you breach the customer's contract.

Error budget is a **decision tool**: budget left ⇒ ship features; budget burnt
⇒ freeze and fix reliability.

Availability, roughly:

| SLO | Downtime / 30 days | Downtime / year |
|---|---|---|
| 99% | ~7.2 h | ~3.65 d |
| 99.9% | ~43 min | ~8.8 h |
| 99.99% | ~4.3 min | ~53 min |
| 99.999% | ~26 s | ~5.3 min |

## 1.7 The three method frameworks

Know which applies to what — this is a classic exam question.

**USE** — for **resources** (CPU, disk, memory, network interfaces):
- **U**tilization — % of time the resource was busy
- **S**aturation — how much queued work is waiting (run queue, disk queue)
- **E**rrors — error event count

**RED** — for **request-driven services**:
- **R**ate — requests per second
- **E**rrors — failed requests per second
- **D**uration — latency distribution

**Four Golden Signals** (Google SRE book) — for **user-facing systems**:
- **Latency** (split successful vs failed!)
- **Traffic**
- **Errors**
- **Saturation**

> Mental model: **USE looks at the machine, RED looks at the request.** Golden
> Signals ≈ RED + Saturation.

## 1.8 Cardinality

**Cardinality = the number of distinct time series.** One series per unique
combination of metric name + label values.

```
http_requests_total{method="GET", status="200", path="/api/users"}
```
If `method` has 5 values, `status` 8, and `path` 200 → 8,000 series from one metric.

**The cardinality bomb:** never put unbounded values in a label — user IDs,
email addresses, session tokens, full URLs with query strings, timestamps,
container IDs that churn. Each new value is a new series held in memory forever
(well, for the retention period).

Rule of thumb: **if you can't enumerate the possible values, it's not a label.**
That's what logs and traces are for.

## 1.9 Alerting philosophy

- **Alert on symptoms, not causes.** "Users are getting 500s" pages someone.
  "A node has high CPU" does not — that's a dashboard.
- Every page should be **urgent, actionable, and require human judgement.**
  If the response is "restart it", automate the restart instead.
- **Alert fatigue** is a failure mode: too many low-value pages train people to
  ignore the high-value ones.

---

## Self-check

Answer these without looking. If I can't, the section above isn't done.

1. Why does Prometheus pull instead of push, and what does it get for free by doing so?
2. Which framework do I apply to a disk, and which to an HTTP API?
3. My SLO is 99.9% over 30 days. How much downtime is that, and what's it called?
4. Give three label values that would blow up cardinality, and say what I'd use instead.
5. What's the difference between an SLO and an SLA, and which one is stricter?
6. Which of the three pillars has a storage cost that doesn't grow with traffic, and why?
7. Why is "CPU is at 95%" usually a bad thing to page on?
8. What does a span carry that lets a tracing backend rebuild the call tree?
9. What is context propagation, and which header standardises it?
10. Head-based vs tail-based sampling: which one can keep every slow trace, and what does it cost?
11. What is an exemplar, and which of the three pillars does it bridge?
12. Structured vs unstructured logs: name the practical difference during an incident.
