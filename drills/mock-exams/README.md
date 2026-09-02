# Mock exams

## The simulator

[`simulator/index.html`](simulator/index.html) is a self-contained mock exam —
open it in a browser, no build step. 79 questions drawn to the official domain
weights, options reshuffled every attempt, 90-minute timer, per-domain scoring
against the 75% pass mark, and a full review with explanations. See
[`simulator/README.md`](simulator/README.md).

Use it for the timed attempts on days 18 and 20 of the plan, and its practice
mode for daily drilling. Record each attempt below.

## How I use this folder

One file per attempt: `attempt-01.md`, `attempt-02.md`, … Each one records the
date, the source, the score **per domain**, and — the part that actually
matters — **every question I got wrong, rewritten as a note in my own words**
with a link to the section of `docs/` that should have covered it.

If a wrong answer doesn't map to anything in `docs/`, that's a gap in the notes,
not just a gap in my memory. Fix the note.

## Template

```markdown
# Attempt 0N — YYYY-MM-DD

Source: <where the questions came from>
Score: NN / NN  (NN%)   Time taken: NN min

| Domain | Right | Total | % |
|---|---:|---:|---:|
| Observability Concepts | | | |
| Prometheus Fundamentals | | | |
| PromQL | | | |
| Instrumentation and Exporters | | | |
| Alerting and Dashboarding | | | |

## Wrong answers

### Q: <the question>
- I answered: …
- Correct answer: …
- **Why I was wrong (my words):** …
- Covered in: `docs/0X-....md#section` — [ ] note updated
```

## Where to get questions

- The O'Reilly / Pearson course's own review quizzes and practice exam
- The `docs/*.md` **Self-check** sections in this repo — cover the page and answer them out loud
- `drills/flashcards.md`
- The official [Prometheus docs](https://prometheus.io/docs/) — read a page, then close it and write down the defaults

## Readiness bar

Two consecutive mocks at **85%+**, with no single domain below 75%, and every
self-check in `docs/` answerable from memory. Below that, keep studying rather
than booking.
