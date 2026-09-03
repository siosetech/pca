# PCA — Prometheus Certified Associate

Study environment and notes for the **Prometheus Certified Associate** exam
(Linux Foundation / CNCF). Target: **1 October 2026**.

The idea behind this repo: **nothing gets written in `content/` that I can't
reproduce in `lab/`.** The lab is a Podman stack that runs on my laptop, and
every claim in the notes has a query, a config file or an alert behind it.

---

## Layout

The split is by **role**, not by topic. `content/` is what I read and write;
`web/` renders it; `lab/` is the system it all describes.

```
pca/
├── content/     everything I read or write. Markdown and data, no code.
│   ├── notes/       one note per exam domain, plus blueprint and cheat sheet
│   ├── drills/      PromQL exercise sets
│   ├── exam/        the question bank and my mock attempts
│   ├── flashcards.md
│   └── exam-traps.md
├── web/         Next.js app that renders content/. Owns no content of its own.
├── lab/         the runnable Prometheus stack (Podman)
├── k8s/         kind cluster for the Kubernetes service-discovery topics
├── journal/     lab journal in AsciiDoc, with screenshots
└── progress/    the 4-week plan and daily log
```

| Path | What lives here |
|---|---|
| `content/notes/00-exam-blueprint.md` | Exam logistics, domain weights, coverage against the official curriculum |
| `content/notes/01`–`05` | One note per domain, in the official domain order |
| `content/notes/99-cheatsheet.md` | The one page I re-read the morning of the exam |
| `content/drills/` | Exercise sets — question, my answer, the reference answer, why |
| `content/exam/questions.json` | **The** question bank. 180 items: papers A and B (60 each, official weights) plus a 60-item spare pool |
| `content/exam/attempts/` | Write-ups of my mock attempts, and the template |
| `content/flashcards.md` | Spaced-repetition cards, in CNCF curriculum order. App: `/flashcards` |
| `web/` | The same material as a browsable app. See [`web/README.md`](web/README.md) |
| `lab/` | `compose.yaml` + configs. See [`lab/README.md`](lab/README.md) |
| `progress/plan-4-weeks.md` | 12 sessions over 4 weeks, weighted by exam domains |

### One bank, one app

`content/exam/questions.json` is the only place questions are edited.
`content/flashcards.md` is the only place flashcards are edited. The app
regenerates `web/lib/data/quiz.ts` and `web/lib/data/flashcards.ts` via
`npm run sync-content` (`predev` and `prebuild` hooks), so the generated
files cannot drift. Do not edit them by hand; `quiz.ts` is gitignored.

The exam runner lives at **`/quiz`**: fixed papers **A** and **B** (timed, 60
questions, official domain weights), or practice from the spare pool. Options
are reshuffled every attempt. Per-domain scoring uses a **75%** line — a
commonly reported pass mark; confirm it in the Candidate Handbook.
Flashcards are at **`/flashcards`** (SM-2, 20 new/day).

---

## Quick start

```powershell
# the lab
cd D:\dev\workspace\pca\lab
podman compose up -d

# the study app
cd D:\dev\workspace\pca\web
npm ci
npm run dev
```

| Service | URL |
|---|---|
| Study app | http://localhost:43145 |
| Prometheus | http://localhost:9090 |
| Alertmanager | http://localhost:9093 |
| Grafana (`admin` / `pca`) | http://localhost:3000 |
| Sample app metrics | http://localhost:8000/metrics |
| node-exporter | http://localhost:9100/metrics |
| Pushgateway | http://localhost:9091 |
| Blackbox exporter | http://localhost:9115 |

---

## Exam at a glance

| Domain | Weight | Notes |
|---|---:|---|
| Observability Concepts | 18% | [`01`](content/notes/01-observability-concepts.md) |
| Prometheus Fundamentals | 20% | [`02`](content/notes/02-prometheus-fundamentals.md) |
| **PromQL** | **28%** | [`03`](content/notes/03-promql.md) |
| Instrumentation and Exporters | 16% | [`04`](content/notes/04-instrumentation-exporters.md) |
| Alerting and Dashboarding | 18% | [`05`](content/notes/05-alerting-dashboarding.md) |

90 minutes, online proctored, multiple choice. Certification valid for 2 years.
Every sub-topic of the official
[CNCF curriculum](https://github.com/cncf/curriculum) is mapped to a section in
[`content/notes/00-exam-blueprint.md`](content/notes/00-exam-blueprint.md).

## Study material

- O'Reilly / Pearson — *Prometheus Certified Associate (PCA) Cert Prep* (Dave Prowse)
- [Official Prometheus docs](https://prometheus.io/docs/) — the exam is written against these

## Conventions

- Notes are written **in my own words**. Copy-paste goes in a block quote with a
  link, so I can tell the two apart when revising.
- Every PromQL expression in the notes has been run against the lab.
- `> TODO` marks a gap I still have to fill:
  `grep -rn "TODO" content/notes/`
