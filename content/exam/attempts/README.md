# Mock exams

## Where the exam lives

The runner is the **Practice Exam** tab of the study app: `cd web && npm run dev`,
then http://localhost:43145/quiz. Questions come from
[`../questions.json`](../questions.json) — 120 of them, drawn to the official
domain weights with the options reshuffled on every attempt.

Exam mode for the timed attempts in sessions 11 and 12 of the plan; practice
mode for daily drilling. Record each attempt below.


## How I use this folder

One file per attempt: `attempt-01.md`, `attempt-02.md`, … Each one records the
date, the source, the score **per domain**, and — the part that actually
matters — **every question I got wrong, rewritten as a note in my own words**
with a link to the section of `content/notes/` that should have covered it.

If a wrong answer doesn't map to anything in `content/notes/`, that's a gap in the notes,
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
- Covered in: `content/notes/0X-....md#section` — [ ] note updated
```

## Where to get questions

- The O'Reilly / Pearson course's own review quizzes and practice exam
- The `content/notes/*.md` **Self-check** sections in this repo — cover the page and answer them out loud
- `content/flashcards.md`
- The official [Prometheus docs](https://prometheus.io/content/notes/) — read a page, then close it and write down the defaults

## Readiness bar

Two consecutive mocks at **85%+**, with no single domain below 75%, and every
self-check in `content/notes/` answerable from memory. Below that, keep studying rather
than booking.
