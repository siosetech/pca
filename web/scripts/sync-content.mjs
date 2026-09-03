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

// Official CNCF curriculum weights. The exam draws to these.
const DOMAINS = [
  { key: "obs", label: "Observability Concepts", weight: 0.18 },
  { key: "fund", label: "Prometheus Fundamentals", weight: 0.2 },
  { key: "promql", label: "PromQL", weight: 0.28 },
  { key: "instr", label: "Instrumentation and Exporters", weight: 0.16 },
  { key: "alert", label: "Alerting and Dashboarding", weight: 0.18 },
];

const all = JSON.parse(readFileSync(bank, "utf8"));
const known = new Set(DOMAINS.map((d) => d.key));
const bad = all.filter(
  (q) =>
    !known.has(q.domain) ||
    q.opts.length !== 4 ||
    !q.ans.length ||
    q.ans.some((a) => a < 0 || a > 3) ||
    (q.type === "single") !== (q.ans.length === 1)
);
if (bad.length) {
  console.error("sync-content: malformed questions:", bad.map((q) => q.id));
  process.exit(1);
}

const rows = all
  .map(
    (q) => `  {
    id: ${JSON.stringify(q.id)},
    domain: ${JSON.stringify(q.domain)},
    type: ${JSON.stringify(q.type)},
    prompt: ${JSON.stringify(q.q)},
    options: ${JSON.stringify(q.opts)},
    answers: ${JSON.stringify(q.ans)},
    why: ${JSON.stringify(q.why)},
    ref: ${JSON.stringify(q.ref ?? "")},
  },`
  )
  .join("\n");

writeFileSync(
  out,
  `// GENERATED FILE - do not edit.
// Source: content/exam/questions.json
// Regenerate: npm run sync-content  (runs automatically on npm run build)

export type DomainKey = ${DOMAINS.map((d) => JSON.stringify(d.key)).join(" | ")};

export type QuizQuestion = {
  id: string;
  domain: DomainKey;
  type: "single" | "multi";
  prompt: string;
  options: string[];
  answers: number[];
  why: string;
  ref: string;
};

/** Official CNCF curriculum weights. Exams are drawn to these proportions. */
export const DOMAINS: { key: DomainKey; label: string; weight: number }[] = ${JSON.stringify(
    DOMAINS,
    null,
    2
  ).replace(/\n/g, "\n")};

/** 90 seconds per question: 60 questions = the real 90-minute exam. */
export const SECONDS_PER_QUESTION = 90;

/** Commonly reported pass mark. Confirm in the Candidate Handbook. */
export const PASS_RATIO = 0.75;

export const quizQuestions: QuizQuestion[] = [
${rows}
];
`
);

const multi = all.filter((q) => q.type === "multi").length;
console.log(
  `sync-content: ${all.length} questions -> lib/data/quiz.ts (${multi} multi-select)`
);
