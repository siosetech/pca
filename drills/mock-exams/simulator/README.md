# Exam simulator

A self-contained mock exam. No build step, no server, no dependencies —
double-click `index.html`, or open it from the browser's **File → Open**.

```powershell
start D:\dev\workspace\pca\drills\mock-exams\simulator\index.html
```

## What it does

- **79 questions** in the bank, drawn to the official domain weights on every
  attempt (60 questions → 11 / 12 / 17 / 9 / 11 across the five domains).
- **Answer options are reshuffled every run**, so the position of the correct
  answer is never learnable.
- **Exam mode** — timed at 90 seconds per question (60 questions = 90 minutes),
  no feedback until the end, flag-for-review, and a navigator grid showing which
  questions are answered, flagged and current.
- **Practice mode** — untimed, with the explanation and the `docs/` reference
  revealed as soon as you answer.
- **Results** — overall score against the 75% pass mark framed as an error
  budget, a per-domain breakdown with the threshold marked, and a full review of
  every question with the reasoning and where it's covered in `docs/`.
- **Retry the ones you missed** in one click, and an attempt history saved in
  the browser.

Keyboard: `1`–`4` or `A`–`D` to answer, `←` `→` to move, `F` to flag, `N` for
the navigator, `Enter` to reveal in practice mode.

## About the exam parameters

The simulator assumes **60 questions, 90 minutes, 75% to pass**. The 90-minute
duration is published by the Linux Foundation; the question count and pass mark
are the commonly reported figures rather than officially published ones —
confirm them in the
[Candidate Handbook](https://docs.linuxfoundation.org/tc-docs/certification/lf-handbook2)
and adjust `PASS` and `SEC_PER_Q` near the top of the script if they differ.

## Adding your own questions

Every question you get wrong in a real practice test should end up here. Find
the `BANK` constant in the script and add an object:

```js
{
  "id": "promql-23",
  "domain": "promql",              // obs | fund | promql | instr | alert
  "type": "single",                // or "multi"
  "q": "The question stem.",
  "opts": ["A", "B", "C", "D"],    // exactly four
  "ans": [0],                      // indices of the correct options
  "why": "Why the right answer is right, and why the traps are wrong.",
  "ref": "docs/03-promql.md"
}
```

Two conventions worth keeping: write the explanation so it teaches rather than
just confirms, and always point `ref` at the section of `docs/` that should have
covered it. If a question has no home in `docs/`, that's a gap in the notes.
