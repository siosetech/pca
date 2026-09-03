# 03 — PromQL (28%) ← the biggest domain

> Mental model: **every PromQL expression evaluates to one of four types**, and
> most errors are a type mismatch. Learn to say out loud what type each piece
> is, and the language stops being mysterious.
>
> ```
> instant vector — one value per series, at one instant   http_requests_total
> range vector   — a slice of values per series           http_requests_total[5m]
> scalar         — a single number                        42
> string         — rarely used                            "hello"
> ```
> **Functions like `rate()` eat a range vector and return an instant vector.
> Aggregations like `sum()` eat an instant vector. You cannot graph a range
> vector.** That single sentence prevents most beginner errors.

---

## 3.1 Selectors

```promql
http_requests_total                                  # all series with this name
http_requests_total{job="api"}                       # equality
http_requests_total{job!="api"}                      # inequality
http_requests_total{job=~"api|web"}                  # regex match  (fully anchored!)
http_requests_total{job!~"canary.*"}                 # regex no-match
{__name__=~"node_cpu.*", mode="idle"}                # match on the name itself
```

Four matchers only: `=`, `!=`, `=~`, `!~`.

Gotchas the exam likes:
- **Regexes are fully anchored.** `job=~"api"` will *not* match `api-server`.
  Write `job=~"api.*"`. (They're RE2, so no backreferences.)
- `{job=~".*"}` matches series where `job` is empty too, because an empty label
  and a missing label are the same thing.
- A selector must have **at least one matcher that does not match the empty
  string** — `{job=~".*"}` alone is an error.

### Range vectors and modifiers

```promql
http_requests_total[5m]                     # last 5 minutes of samples, per series
http_requests_total offset 1h               # value as it was 1 hour ago
http_requests_total[5m] offset 1w           # both
http_requests_total @ 1609746000            # value at a fixed unix timestamp
http_requests_total @ end()                 # value at the end of the query range
```
Duration units: `ms s m h d w y`, combinable (`1h30m`). `offset` comes **after**
the range selector, `@` after that.

## 3.2 Counters: `rate`, `irate`, `increase`

The single most important family in the exam.

```promql
rate(http_requests_total[5m])      # per-second average rate over the window
irate(http_requests_total[5m])     # per-second rate from the LAST TWO samples in the window
increase(http_requests_total[5m])  # total increase over the window  == rate(...) * 300
```

- All three **only make sense on counters** and all three **handle resets**: a
  drop in value is treated as a restart, not a negative rate.
- They need **at least two samples** in the window. Rule of thumb: make the
  range **at least 4× the scrape interval** so a missed scrape doesn't produce a
  gap. (15s scrape ⇒ `[1m]` minimum, `[5m]` is the safe default.)
- `rate` and `increase` **extrapolate** to the window edges, which is why
  `increase()` on a rarely-incremented counter can return a non-integer like
  `3.7`. This is expected, not a bug.
- `irate` is spiky — good for volatile, fast-moving graphs, bad for alerting.
  **Use `rate` for alerts and for anything you'll aggregate.**
- **Never take `rate()` of an already-aggregated counter.** Always
  `sum(rate(x[5m]))`, never `rate(sum(x)[5m:])` — summing hides the resets, so
  a pod restart shows as a huge negative dip that `rate` can't correct for.

  > Say it as a rule: **rate first, then sum.**

Other counter/gauge functions:

| Function | Input | Does |
|---|---|---|
| `resets(v[5m])` | counter range | how many times it reset |
| `changes(v[5m])` | range | how many times the value changed |
| `delta(v[5m])` | **gauge** range | difference between first and last, extrapolated |
| `idelta(v[5m])` | gauge range | difference between the last two samples |
| `deriv(v[5m])` | gauge range | per-second derivative via least-squares |
| `predict_linear(v[1h], 4*3600)` | gauge range | extrapolate 4 h ahead — the classic "disk will fill" alert |

## 3.3 Aggregation

```promql
sum(rate(http_requests_total[5m]))                       # collapse everything to one number
sum by (job, status) (rate(http_requests_total[5m]))     # keep these labels
sum without (instance) (rate(http_requests_total[5m]))   # drop these labels, keep the rest
```

Operators: `sum min max avg group count count_values stddev stdvar topk bottomk quantile`

- `by` **keeps only** the listed labels; `without` **removes** the listed labels.
  `by` is the one that surprises people — everything not listed is thrown away.
- `topk(3, x)` / `bottomk(3, x)` return **series**, not a number, and preserve labels.
- `count_values("version", build_info)` counts how many series share each value
  and puts that value into a new label.
- `quantile(0.9, x)` — quantile **across series**, not over time. Not the same
  as `histogram_quantile`.
- The `<aggr>_over_time` family is the *time* counterpart, and takes a **range
  vector**: `avg_over_time`, `max_over_time`, `min_over_time`, `sum_over_time`,
  `count_over_time`, `quantile_over_time`, `stddev_over_time`, `last_over_time`,
  `present_over_time`.

  > **`avg(x)` averages across series at one instant. `avg_over_time(x[5m])`
  > averages one series across time.** Different axes. This gets tested.

## 3.4 Operators and vector matching

Arithmetic: `+ - * / % ^` · Comparison: `== != > < >= <=` · Logical: `and or unless`

Comparison operators **filter** by default:
```promql
node_filesystem_avail_bytes < 10e9          # returns only the matching series
node_filesystem_avail_bytes < bool 10e9     # returns 1 or 0 for every series
```
The `bool` modifier is required when comparing two scalars.

### One-to-one matching

Two instant vectors match on **all their labels** by default. Series without an
exact counterpart on the other side simply vanish — silently. This is the
number-one source of "my query returns nothing".

```promql
# only works if both sides have identical label sets
rate(errors_total[5m]) / rate(requests_total[5m])

# restrict which labels must match
rate(errors_total[5m]) / on (job, instance) rate(requests_total[5m])

# match on everything EXCEPT these
rate(errors_total[5m]) / ignoring (status) rate(requests_total[5m])
```

### Many-to-one: `group_left` / `group_right`

Needed when one side has more series than the other — classically, joining a
metric to an *info* metric to pull in extra labels.

```promql
# many samples on the LEFT, one on the right ⇒ group_left
rate(http_requests_total[5m])
  * on (instance) group_left (version)
    node_exporter_build_info
```
- The **arrow points at the "many" side.** `group_left` = many on the left.
- The labels in parentheses after `group_left(...)` are the extra labels copied
  **from the "one" side** onto the result.
- Only the "many" side's labels survive otherwise.

`and` / `or` / `unless` also match on labels:
```promql
up == 1 unless on (instance) node_maintenance_mode == 1
```

**Operator precedence** (highest first): `^`, `* / % atan2`, `+ -`,
comparison, `and unless`, `or`. `^` is right-associative.

## 3.5 Histograms and quantiles

```promql
histogram_quantile(
  0.95,
  sum by (le) (rate(http_request_duration_seconds_bucket[5m]))
)
```
Rules that get tested:
1. The input must be **bucket** series, and the `le` label **must survive** the
   aggregation — hence `by (le)`.
2. Always `rate()` the buckets first; raw cumulative buckets give you the
   all-time quantile, not the recent one.
3. Buckets are **cumulative** — `le="0.5"` counts everything ≤ 0.5s, and there
   is always a `le="+Inf"` bucket equal to `_count`.
4. The result is **interpolated within a bucket**, so accuracy is bounded by
   your bucket boundaries. A p99 above your highest finite bucket is unusable.
5. `0.95` outside `[0,1]` gives `NaN`; fewer than two buckets gives `NaN`.

Average latency (a common trick question — you use `_sum` and `_count`, and you
divide two rates, not two raw counters):
```promql
rate(http_request_duration_seconds_sum[5m])
  / rate(http_request_duration_seconds_count[5m])
```

SLO-style ratio — fraction of requests under 300 ms:
```promql
sum(rate(http_request_duration_seconds_bucket{le="0.3"}[5m]))
  / sum(rate(http_request_duration_seconds_count[5m]))
```

## 3.6 Subqueries

A subquery turns an instant-vector expression back into a range vector:

```promql
max_over_time( rate(http_requests_total[5m])[1h:1m] )
#                   ^ inner query        ^range ^resolution (optional)
```
Read it as: "evaluate `rate(...[5m])` every 1m for the last 1h, then take the
max." Subqueries are expensive — in production, use a recording rule instead.

## 3.7 Label and utility functions

```promql
label_replace(up, "host", "$1", "instance", "(.*):.*")   # new label from a regex capture
label_join(up, "key", "-", "job", "instance")            # concatenate labels
absent(up{job="api"})                                    # 1 if the series is MISSING — alert on disappearance
absent_over_time(up{job="api"}[1h])
clamp_max(x, 100) / clamp_min(x, 0) / clamp(x, 0, 100)
vector(1)          # scalar → instant vector
scalar(x)          # single-series instant vector → scalar (NaN otherwise)
time()             # evaluation timestamp, seconds
timestamp(x)       # timestamp of each sample
sort() / sort_desc()
round() floor() ceil() abs() sgn() exp() ln() log2() log10() sqrt()
day_of_week() hour() month() year() days_in_month()
```

`absent()` is the idiomatic way to alert that a target has **vanished
entirely** — `up == 0` can't fire for a target that no longer exists.

## 3.8 Timestamp metrics

A named sub-topic in the official curriculum, and easy to skip because it looks
trivial. The idea: **a Unix timestamp exposed as a gauge**, which you then
compare against the current time.

Common ones:

| Metric | Meaning |
|---|---|
| `process_start_time_seconds` | when the process started |
| `node_boot_time_seconds` | when the host booted |
| `probe_ssl_earliest_cert_expiry` | when the TLS certificate expires |
| `<job>_last_success_timestamp_seconds` | when a batch job last succeeded (you expose this) |

And two functions that produce time rather than read it:

```promql
time()                 # the query evaluation time, in Unix seconds
timestamp(up)          # the timestamp OF EACH SAMPLE in the vector, as a value
```

> The difference is worth saying out loud. `time()` is *when the query ran*.
> `timestamp(v)` is *when each sample in v was recorded*. Confusing them is a
> classic exam trap.

### The patterns

```promql
# How long has this process been running?
time() - process_start_time_seconds

# Did the nightly batch job succeed in the last 24 hours?
time() - backup_last_success_timestamp_seconds > 86400

# TLS certificate expiring within a week
probe_ssl_earliest_cert_expiry - time() < 7 * 86400

# How stale is this series? (useful when debugging a dead exporter)
time() - timestamp(my_metric)
```

The batch-job pattern is the important one: it is **how you alert that something
did not happen.** A counter cannot express absence — nothing increments when a
job fails to run — but a "last success" timestamp drifting away from `time()`
grows without bound until someone fixes it. This is the natural partner to the
Pushgateway and to node_exporter's textfile collector.

### Time-of-day functions

These take an optional vector of timestamps and default to `time()`:

```promql
hour()          # 0-23, UTC
day_of_week()   # 0 = Sunday
day_of_month()  month()  year()  days_in_month()  minute()
```

Used to scope an alert to business hours. Note that PromQL has **no chained
comparison** - `hour() >= 8 < 18` is not valid, you need two clauses joined with
`and`:

```promql
job:app_requests:error_ratio5m > 0.05
  and on() (hour() >= 8)
  and on() (hour() < 18)
```

CAUTION: they work in **UTC**, not your local timezone. Alertmanager's
`mute_time_intervals` is usually the better tool for this, because it does
understand timezones.

## 3.9 Patterns worth memorising

```promql
# Request rate per second, by service
sum by (job) (rate(http_requests_total[5m]))

# Error ratio (0–1)
sum(rate(http_requests_total{status=~"5.."}[5m]))
  / sum(rate(http_requests_total[5m]))

# CPU utilisation per instance (node_exporter)
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory used %
(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100

# Disk full in 4 hours?
predict_linear(node_filesystem_avail_bytes{mountpoint="/"}[1h], 4*3600) < 0

# Targets down
up == 0

# Restarts in the last hour
increase(process_start_time_seconds[1h]) > 0     # or: changes(process_start_time_seconds[1h])

# p95 latency by route
histogram_quantile(0.95,
  sum by (le, route) (rate(http_request_duration_seconds_bucket[5m])))
```

## 3.10 The mistakes I will actually make

| Wrong | Right | Why |
|---|---|---|
| `rate(sum(x)[5m:])` | `sum(rate(x[5m]))` | summing hides counter resets |
| `sum(x_bucket)` then `histogram_quantile` | `sum by (le) (rate(x_bucket[5m]))` | `le` must survive |
| `job=~"api"` | `job=~"api.*"` | regexes are fully anchored |
| `rate(memory_bytes[5m])` | `deriv(...)` or just the gauge | `rate` is for counters |
| graphing `x[5m]` | `rate(x[5m])` or `avg_over_time(x[5m])` | range vectors can't be graphed |
| `avg(latency_p99)` across pods | use a histogram | you can't average quantiles |
| `a / b` returning nothing | `a / on (job) b` | label sets didn't match |
| `x[1m]` with a 1m scrape | `x[5m]` | need ≥ 2 samples, with slack |

---

## Self-check

1. What type does `rate()` take, and what type does it return?
2. Difference between `by` and `without` in one sentence each.
3. Why `sum(rate(x[5m]))` and never `rate(sum(x)[5m:])`?
4. `increase()` returns `4.6` for a counter of whole events. Is this a bug?
5. Write p90 latency by route, from a histogram, from memory.
6. What does `group_left` mean, and which side do the extra labels come from?
7. When do I need the `bool` modifier?
8. `avg(x)` vs `avg_over_time(x[5m])` — which axis does each average over?
9. How do I alert that a target has disappeared entirely rather than gone down?
10. My range is `[30s]` and my scrape interval is `30s`. What happens and why?
11. `time()` vs `timestamp(v)` — which is the query's evaluation time?
12. Write the alert expression for "the nightly backup has not succeeded in 24 hours".
13. Why can a counter not express "this job never ran", and what can?
14. `hour() >= 8` in an alert: what timezone is that, and what should I use instead?
