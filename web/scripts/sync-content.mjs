// Generates lib/data/quiz.ts from the single question bank at
// content/exam/questions.json. Runs automatically before `npm run build`
// (see the "prebuild" script), so the app can never drift from the bank.
//
// Edit questions in content/exam/questions.json, never in the generated file.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const bank = resolve(here, "../../content/exam/questions.json");
const out = resolve(here, "../lib/data/quiz.ts");

const DOMAIN_LABEL = {
  obs: "Observability Concepts",
  fund: "Prometheus Fundamentals",
  promql: "PromQL",
  instr: "Instrumentation and Exporters",
  alert: "Alerting and Dashboarding",
};

const all = JSON.parse(readFileSync(bank, "utf8"));

// The quiz component takes a single correct index. Multi-select questions live
// in the standalone simulator until the component grows checkbox support.
const single = all.filter((q) => q.type === "single" && q.ans.length === 1);
const skipped = all.length - single.length;

const body = single
  .map(
    (q, i) => `  {
    id: ${i + 1},
    domain: ${JSON.stringify(DOMAIN_LABEL[q.domain] ?? q.domain)},
    prompt: ${JSON.stringify(q.q)},
    options: ${JSON.stringify(q.opts)},
    answer: ${q.ans[0]},
    why: ${JSON.stringify(q.why)},
    ref: ${JSON.stringify(q.ref ?? "")},
  },`
  )
  .join("\n");

writeFileSync(
  out,
  `// GENERATED FILE - do not edit.
// Source: content/exam/questions.json
// Regenerate: npm run sync-content  (also runs automatically on npm run build)

export type QuizQuestion = {
  id: number;
  domain: string;
  prompt: string;
  options: string[];
  answer: number;
  why: string;
  ref: string;
};

export const quizQuestions: QuizQuestion[] = [
${body}
];
`
);

console.log(
  `sync-content: ${single.length} questions written to lib/data/quiz.ts` +
    (skipped ? ` (${skipped} multi-select left to the standalone simulator)` : "")
);
