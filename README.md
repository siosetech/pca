# PCA — Prometheus Certified Associate

My study environment and notes for the **Prometheus Certified Associate** exam
(Linux Foundation / CNCF). Target: pass within three weeks.

The idea behind this repo: **nothing gets written in `docs/` that I can't
reproduce in `lab/`.** The lab is a Podman stack that runs on my laptop, and
every claim in the notes has a query, a config file or an alert behind it.

---

## Layout

```
pca/
├── docs/        # study notes, one file per exam domain
├── lab/         # the runnable Prometheus stack (Podman)
├── drills/      # PromQL exercises, flashcards, the exam simulator
├── progress/    # 3-week plan + daily log
└── .github/     # CI: promtool/amtool validate every config on push
```

| Path | What lives here |
|---|---|
| `docs/00-exam-blueprint.md` | Exam logistics, domain weights, self-assessment tracker |
| `docs/01`–`docs/05` | One note per domain, in the official domain order |
| `docs/99-cheatsheet.md` | The one page I re-read the morning of the exam |
| `lab/` | `compose.yaml` + configs. See [`lab/README.md`](lab/README.md) |
| `drills/promql/` | Exercise sets — question, my answer, the reference answer, why |
| `drills/flashcards.md` | Q/A pairs for spaced repetition |
| `drills/mock-exams/simulator/` | Interactive timed mock exam — open `index.html` in a browser |
| `progress/plan-3-weeks.md` | Day-by-day plan, weighted by exam domains |
| `progress/log.md` | What I actually did each day |

---

## Quick start

```powershell
cd D:\dev\workspace\pca\lab
podman compose up -d
```

| Service | URL |
|---|---|
| Prometheus | http://localhost:9090 |
| Alertmanager | http://localhost:9093 |
| Grafana (`admin` / `admin`) | http://localhost:3000 |
| Sample app metrics | http://localhost:8000/metrics |
| node-exporter | http://localhost:9100/metrics |
| Pushgateway | http://localhost:9091 |
| Blackbox exporter | http://localhost:9115 |

Full details, troubleshooting and teardown: [`lab/README.md`](lab/README.md).

---

## Exam at a glance

| Domain | Weight | Notes |
|---|---:|---|
| Observability Concepts | 18% | [`docs/01`](docs/01-observability-concepts.md) |
| Prometheus Fundamentals | 20% | [`docs/02`](docs/02-prometheus-fundamentals.md) |
| **PromQL** | **28%** | [`docs/03`](docs/03-promql.md) |
| Instrumentation and Exporters | 16% | [`docs/04`](docs/04-instrumentation-exporters.md) |
| Alerting and Dashboarding | 18% | [`docs/05`](docs/05-alerting-dashboarding.md) |

90 minutes, online proctored, multiple choice. Certification is valid for 2 years.
Confirm the current question count and passing score in the
[Candidate Handbook](https://docs.linuxfoundation.org/tc-docs/certification/lf-handbook2)
before booking — see `docs/00-exam-blueprint.md`.

## Study material

- O'Reilly / Pearson — *Prometheus Certified Associate (PCA) Cert Prep* (Dave Prowse, 12+ h video)
- [Official Prometheus docs](https://prometheus.io/docs/) — the exam is written against these
- [CNCF PCA curriculum](https://github.com/cncf/curriculum)

## Conventions

- Notes are written **in my own words**. Copy-paste from the docs goes in a
  block quote with a link, so I can tell the two apart when revising.
- Every PromQL expression in the notes has been run against the lab.
- `> TODO` marks a gap I still have to fill. Grep for it before the exam:
  `grep -rn "TODO" docs/`
