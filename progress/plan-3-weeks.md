# The three-week plan

Start: **2026-09-02** · Target exam date: **2026-09-23** (book it now — the
booked date is what makes the plan real)

Budget: ~2 h/day on weekdays, ~4 h on weekend days ≈ **32 hours**. The video
course is 12 h, which leaves ~20 h for the lab, drills and review. That ratio is
deliberate: **watching is the cheapest and least effective part.**

The daily shape:

```
 50 min   video / reading      (input)
 45 min   lab + PromQL drills  (application)   ← the part that actually sticks
 15 min   write the notes up   (encoding)
 10 min   flashcards, including yesterday's misses (retrieval)
```

---

## Week 1 — Foundations (Sep 2 – Sep 8)

Goal: the lab runs, and I can explain the architecture to someone else.

| Day | Input | Application | Output |
|---|---|---|---|
| **1** Wed | Course intro + Observability Concepts | `podman compose up -d`, get all targets green | `docs/01` filled in |
| **2** Thu | Finish Observability Concepts | Drill [01 — selectors](../drills/promql/01-selectors.md) | `docs/01` self-check answered from memory |
| **3** Fri | Prometheus architecture & components | Read every line of `lab/prometheus/prometheus.yml`; change `scrape_interval` and observe | `docs/02` §2.1–2.2 |
| **4** Sat | Data model, metric types, config | Lab exercises 1 & 2 (break a target, add one via file_sd) | `docs/02` §2.3–2.4 |
| **5** Sun | Service discovery + relabeling | Lab exercise 3 (drop a metric with `metric_relabel_configs`) | `docs/02` §2.4, relabel table memorised |
| **6** Mon | TSDB, storage, federation, HA | Explore `/api/v1/status/tsdb`, `/targets`, `/federate` | `docs/02` §2.5–2.7 |
| **7** Tue | **Review day** | Re-do any 🟡/❌ drills | Self-assessment column W1; first mock if one is available |

**End of week 1 checkpoint:** all of `docs/01` and `docs/02` written, no `TODO`s
left in them, and the six numbers in the cheat sheet recalled cold.

---

## Week 2 — PromQL and instrumentation (Sep 9 – Sep 15)

Goal: write any of the ten cheat-sheet queries from memory. **This is 44% of the
exam — it gets the most time.**

| Day | Input | Application | Output |
|---|---|---|---|
| **8** Wed | PromQL: types, selectors, operators | Drill 01 again, cold | `docs/03` §3.1 |
| **9** Thu | PromQL: counters and rates | Drill [02 — rates](../drills/promql/02-rates-and-counters.md) | `docs/03` §3.2 |
| **10** Fri | PromQL: aggregation | Drill [03 — aggregation](../drills/promql/03-aggregation-and-matching.md), stop at Q7 | `docs/03` §3.3 |
| **11** Sat | PromQL: vector matching, `group_left` | Finish drill 03; build a panel that joins to `app_build_info` | `docs/03` §3.4 |
| **12** Sun | PromQL: histograms, subqueries | Drill [04 — histograms](../drills/promql/04-histograms-and-slo.md) | `docs/03` §3.5–3.6 |
| **13** Mon | Instrumentation & exposition format | Add a new metric to `lab/apps/sample-app/app.py`, rebuild, query it | `docs/04` §4.1–4.2 |
| **14** Tue | Exporters: node, blackbox, pushgateway | Lab exercise 4 (push a batch metric, then delete it) | `docs/04` §4.3; self-assessment W2 |

**End of week 2 checkpoint:** every query in `docs/99-cheatsheet.md` §"Ten
queries" written from memory into the expression browser, with no reference open.

---

## Week 3 — Alerting, review, exam (Sep 16 – Sep 23)

Goal: convert knowledge into exam points.

| Day | Input | Application | Output |
|---|---|---|---|
| **15** Wed | Recording & alerting rules | Write one new rule of each kind; `promtool check rules` | `docs/05` §5.1–5.2 |
| **16** Thu | Alertmanager: routing, grouping | Lab exercises 5 & 6 (silence, inhibition) | `docs/05` §5.3 |
| **17** Fri | Grafana & dashboarding | Rebuild two dashboard panels from memory | `docs/05` §5.4 |
| **18** Sat | **Mock exam #1**, full time | Review every wrong answer in `drills/mock-exams/` | Notes updated where the mock found gaps |
| **19** Sun | Weak-domain repair (whatever the mock exposed) | Re-drill that domain | — |
| **20** Mon | **Mock exam #2** | Same review loop | — |
| **21** Tue | Light: cheat sheet + flashcards only. No new material | — | Self-assessment W3 |
| **22–23** | **Exam.** Sleep, don't cram | | |

---

## Rules for myself

- **Never watch a video without the lab open in the next window.** Pause,
  reproduce, then continue.
- **If I can't answer a self-check without looking, that section isn't done.**
- A `TODO` in `docs/` at the end of week 2 is a red flag. `grep -rn TODO docs/`
- Flashcards are **daily and non-negotiable**, including on review days. Ten
  minutes of retrieval beats an hour of re-reading.
- If I fall behind: cut video, not lab. Cut week-3 polish, not PromQL.
- Book the exam in week 1. An unbooked exam slips forever.

## If I only have one week

Days 1–2: `docs/02` fundamentals + get the lab running.
Days 3–5: `docs/03` PromQL, all four drill sets, twice.
Day 6: `docs/05` alerting + `docs/04` exporters, skim.
Day 7: cheat sheet, flashcards, one mock.
That covers 48% (PromQL + Fundamentals) properly and the rest at recall level.
