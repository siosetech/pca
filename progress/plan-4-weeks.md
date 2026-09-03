# The plan — 12 sessions over 4 weeks

Start: **2026-09-03** · Target exam: **Wednesday 1 October 2026**

Availability: **3 days a week, 4–5 hours a session** ≈ 12–15 h/week, so ~54 hours
across 12 sessions.

The work is worth roughly 36–45 hours:

| | Hours |
|---|---|
| Video, at 1.5–2× playback because you pause and reproduce | 18–22 |
| Lab exercises and PromQL drills beyond the video | 8–10 |
| Writing the notes up | 4–5 |
| Mocks and repairing what they expose | 6–8 |

The gap between 54 and 45 is the buffer. It will get used.

## The session shape

```
 15 min   flashcards, starting with last session's misses   ← retrieval BEFORE input
100 min   video, paused whenever something is reproducible
 60 min   lab + PromQL drills
 45 min   write the content/notes/ section in my own words
 20 min   journal entry and log
```

Retrieval first is deliberate. Opening with recall tells you what actually
survived the gap, which is the information you need to decide what to re-read.

## The off-day rule

**Ten minutes of flashcards on every non-study day.** Non-negotiable, and the
single highest-return habit in this plan. Three sessions a week means 1–3 day
gaps; ten minutes of retrieval preserves what those gaps would otherwise erode.
Skipping it means paying for the same material twice.

## The course's pacing is not the exam's pacing

Worth knowing before you start, because following the video's runtime would
misallocate your time:

| Lesson | Runtime | Exam reality |
|---|---:|---|
| L12 Monitoring Kubernetes | **1h54m**, the longest | Kubernetes is not a named curriculum bullet. Watch at speed |
| L9 PromQL | 1h41m | The 28% domain. Deserves **more** time than its runtime |
| L3 Installing Prometheus | 1h7m | Your lab already runs. Skim, compare, move on |
| L13 Exam Prep and Final Quiz | 1h30m | Highest value per minute in the whole course |

---

## Week 1 — Foundations (Sep 3–9)

**S1.** L1 + L2 Prometheus Fundamentals + L3 Installing (skim — the lab already
runs; watch for what the instructor does differently).
→ `content/notes/02` §2.1–2.3. Lab exercise 1: break a target, watch `up` go to 0.

**S2.** L4 Observability Concepts.
→ `content/notes/01` in full, including logs/events and tracing/spans. Drill 01.

**S3.** L6 Monitoring Fundamentals.
→ `content/notes/02` §2.4–2.8: service discovery, relabeling, TSDB, limitations.
Lab exercises 2 and 3 — file_sd, and dropping a metric with
`metric_relabel_configs`.

**Checkpoint:** `content/notes/01` and `content/notes/02` have no `TODO` left, and the numbers in
the cheat sheet come back cold.

## Week 2 — PromQL, the 28% (Sep 10–16)

**S4.** L5 Querying Prometheus + first half of L9.
→ `content/notes/03` §3.1–3.2. Drills 01 and 02.

**S5.** Second half of L9.
→ `content/notes/03` §3.3–3.4. Drill 03, including the `group_left` join.

**S6.** **No new video.** Consolidation day.
→ `content/notes/03` §3.5–3.8: histograms, subqueries, timestamp metrics. Drill 04.
Then write all ten cheat-sheet queries into the expression browser from memory,
with nothing open.

**Checkpoint:** those ten queries, blind. If not, S7 starts with them.

## Week 3 — Instrumentation and alerting (Sep 17–23)

**S7.** L10 Instrumenting Data.
→ `content/notes/04`. Add a metric to `lab/sample-app/app.py`, rebuild, query it.

**S8.** L8 Alerting and Rules.
→ `content/notes/05` §5.1–5.2. Write one recording rule and one alerting rule of your
own, then `promtool check rules`.

**S9.** L7 Dashboarding + the Alertmanager portion of L8.
→ `content/notes/05` §5.3–5.5. Lab exercises 5 and 6: a silence, and inhibition.

**Checkpoint:** the alert state machine and the three Alertmanager timers,
explained out loud without notes.

## Week 4 — Breadth, mocks, exam (Sep 24–Oct 1)

**S10.** L11 Monitoring Linux + L12 Monitoring Kubernetes, both at speed.
Kubernetes matters here only as SD roles and kube-state-metrics vs cAdvisor.

**S11.** **Mock #1 — paper A**, full 90 minutes under exam conditions, in the
study app (`/quiz`). Then review every wrong answer into
`content/exam/attempts/`, and repair the weakest domain. Do not practice on
A or B before this; use the spare pool.

**S12.** L13 Exam Prep and Final Quiz, then **Mock #2 — paper B**. Finish here
— no new material after this session.

**Exam day.** Cheat sheet and flashcards only. No cramming, no new material.

---

## Decision points

**After S6 (end of week 2):** if the ten queries aren't blind yet, PromQL takes
a slice of S7 and S8. It is 28% of the paper; nothing else outranks it.

**After S11 (Mock #1):** this is the go/no-go.

| Mock #1 | Do this |
|---|---|
| 85%+ | Consider pulling the exam **forward** to ~24 September |
| 70–85% | Stay on 1 October. Spend S12 on the weak domains |
| below 70% | **Move the exam out a week.** Rescheduling is free up to 24h before |

## Readiness bar

Two consecutive mocks (A then B) at **85%+**, no single domain below **75%**, and every
Self-check in `content/notes/` answerable from memory. Below that, move the date rather
than hope.

## Rules

- Never watch video without the lab open in the next window.
- If a section's Self-check needs the page open, that section isn't done.
- Falling behind: cut video, not lab. Cut week-4 breadth, not PromQL.
- Ten minutes of flashcards on off days. Every off day.
- `grep -rn TODO content/notes/` before every checkpoint.
