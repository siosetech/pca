# Study app

Next.js app that renders `content/`. It owns no question bank, notes, or
flashcards of its own.

```powershell
cd D:\dev\workspace\pca\web
npm ci
npm run dev
```

http://localhost:43145 — `predev` runs `sync-content` first.

| Route | What |
|---|---|
| `/` | Overview: domain weights and lab endpoints |
| `/lab` | Compose start command, services, walkthrough |
| `/domains` | Curriculum, one page per official domain |
| `/promql` | Lab queries against `localhost:9090` |
| `/quiz` | Papers A / B, or practice from the spare pool |
| `/flashcards` | SM-2 deck from `content/flashcards.md` |
| `/cheatsheet` | Closed-book patterns |
| `/extras` | Linux, Kubernetes SD, heatmaps, exam traps |

## Content sync

```powershell
npm run sync-content
```

Reads `content/exam/questions.json` and `content/flashcards.md`, writes
`lib/data/quiz.ts` (gitignored) and `lib/data/flashcards.ts`. Also runs as
`predev` and `prebuild`.

Papers A and B must each be 60 questions at official weights
(11 / 12 / 17 / 9 / 11) or the script exits. Spare items use `"form": null`.
