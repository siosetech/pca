# Mock exams

## Where the exam lives

The runner is the **Quiz** tab of the study app: `cd web && npm run dev`,
then http://localhost:43145/quiz.

Questions live in [`../questions.json`](../questions.json) — **180** items:

| Set | Count | Use |
|---|---:|---|
| Paper **A** | 60 | Mock #1 (S11). Official weights: 11 / 12 / 17 / 9 / 11 |
| Paper **B** | 60 | Mock #2 (S12). Same weights, different questions |
| Spare (`form: null`) | 60 | Daily practice. Do not burn A or B on this |

Options are reshuffled on every attempt. The app's pass line is **75%** —
commonly reported; confirm in the Candidate Handbook.

Exam mode for the timed attempts in sessions 11 and 12; practice mode for
daily drilling from the spare pool. Record each attempt below.


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
- The official [Prometheus docs](https://prometheus.io/docs/) — read a page, then close it and write down the defaults

## Readiness bar

Two consecutive mocks (paper A, then paper B) at **85%+**, with no single
domain below 75%, and every self-check in `content/notes/` answerable from
memory. Below that, keep studying rather than booking.
