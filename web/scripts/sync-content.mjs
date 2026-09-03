// Generates web/lib/data/{quiz,flashcards}.ts from the sources in content/.
// Runs automatically before `npm run build` (the "prebuild" script), so the app
// can never drift from the material.
//
// Edit content/exam/questions.json and content/flashcards.md.
// Never edit the generated files.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const contentDir = resolve(here, "../../content");
const dataDir = resolve(here, "../lib/data");

// Official CNCF curriculum weights. The exam draws to these.
const DOMAINS = [
  { key: "obs", label: "Observability Concepts", weight: 0.18 },
  { key: "fund", label: "Prometheus Fundamentals", weight: 0.2 },
  { key: "promql", label: "PromQL", weight: 0.28 },
  { key: "instr", label: "Instrumentation and Exporters", weight: 0.16 },
  { key: "alert", label: "Alerting and Dashboarding", weight: 0.18 },
];

const BANNER = (source) => `// GENERATED FILE - do not edit.
// Source: ${source}
// Regenerate: npm run sync-content  (runs automatically on npm run build)
`;

/* ── exam questions ───────────────────────────────────────────────────── */

function buildQuiz() {
  const all = JSON.parse(readFileSync(resolve(contentDir, "exam/questions.json"), "utf8"));
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

  // Each fixed paper must be a full 60 drawn to the official weights, or the
  // mock is not measuring what the real exam measures.
  for (const form of ["A", "B"]) {
    const paper = all.filter((q) => q.form === form);
    const want = Object.fromEntries(
      (() => {
        const raw = DOMAINS.map((d) => [d.key, 60 * d.weight]);
        const base = raw.map(([k, v]) => [k, Math.floor(v)]);
        let left = 60 - base.reduce((a, [, v]) => a + v, 0);
        raw
          .map(([, v], i) => [v - Math.floor(v), i])
          .sort((a, b) => b[0] - a[0])
          .forEach(([, i]) => {
            if (left > 0) {
              base[i][1]++;
              left--;
            }
          });
        return base;
      })()
    );
    const got = paper.reduce((a, q) => ({ ...a, [q.domain]: (a[q.domain] ?? 0) + 1 }), {});
    const off = DOMAINS.filter((d) => (got[d.key] ?? 0) !== want[d.key]);
    if (paper.length !== 60 || off.length) {
      console.error(
        `sync-content: paper ${form} is ${paper.length} questions`,
        JSON.stringify(got),
        "expected",
        JSON.stringify(want)
      );
      process.exit(1);
    }
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
    form: ${JSON.stringify(q.form ?? null)},
  },`
    )
    .join("\n");

  writeFileSync(
    resolve(dataDir, "quiz.ts"),
    `${BANNER("content/exam/questions.json")}
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
  /** "A" or "B" for the two fixed papers; null for the spare practice pool. */
  form: "A" | "B" | null;
};

/** Official CNCF curriculum weights. Exams are drawn to these proportions. */
export const DOMAINS: { key: DomainKey; label: string; weight: number }[] =
  ${JSON.stringify(DOMAINS, null, 2)};

/** 90 seconds per question: 60 questions = the real 90-minute exam. */
export const SECONDS_PER_QUESTION = 90;

/** Commonly reported pass mark. Confirm in the Candidate Handbook. */
export const PASS_RATIO = 0.75;

export const quizQuestions: QuizQuestion[] = [
${rows}
];
`
  );
  return { count: all.length, multi: all.filter((q) => q.type === "multi").length };
}

/* ── flashcards ───────────────────────────────────────────────────────── */

// Section heading in flashcards.md -> domain key. Headings are prose, so match
// loosely rather than demanding an exact string.
const HEADING_TO_DOMAIN = [
  [/observab/i, "obs"],
  [/fundamental|prometheus fundamentals/i, "fund"],
  [/promql/i, "promql"],
  [/instrument|exporter/i, "instr"],
  [/alert|dashboard/i, "alert"],
];

/** Stable id from the question text, so reordering rows never loses progress. */
function fnv1a(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

function buildFlashcards() {
  const md = readFileSync(resolve(contentDir, "flashcards.md"), "utf8");
  const cards = [];
  const anomalies = [];
  let domain = null;
  let topic = "";

  for (const raw of md.split("\n")) {
    const line = raw.trim();

    const h3 = line.match(/^###\s+(.*)$/);
    if (h3) {
      topic = h3[1].trim();
      continue;
    }
    const heading = line.match(/^##\s+(.*)$/);
    if (heading) {
      const found = HEADING_TO_DOMAIN.find(([re]) => re.test(heading[1]));
      domain = found ? found[1] : null;
      topic = "";
      continue;
    }
    if (!domain || !line.startsWith("|")) continue;

    const cells = line
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());

    if (cells.length !== 2) {
      anomalies.push(line.slice(0, 60));
      continue;
    }
    const [front, back] = cells;
    if (!front || !back) continue;
    if (/^-{2,}$/.test(front) || /^:?-+:?$/.test(front)) continue; // separator row
    if (/^question$/i.test(front)) continue; // header row

    cards.push({ id: fnv1a(front), domain, topic, front, back });
  }

  const seen = new Set();
  const unique = cards.filter((c) => (seen.has(c.id) ? false : seen.add(c.id)));
  if (unique.length !== cards.length) {
    console.warn(`sync-content: ${cards.length - unique.length} duplicate flashcard fronts dropped`);
  }
  if (anomalies.length) {
    console.warn("sync-content: skipped malformed flashcard rows:", anomalies);
  }

  const rows = unique
    .map(
      (c) =>
        `  { id: ${JSON.stringify(c.id)}, domain: ${JSON.stringify(c.domain)}, topic: ${JSON.stringify(
          c.topic
        )}, front: ${JSON.stringify(c.front)}, back: ${JSON.stringify(c.back)} },`
    )
    .join("\n");

  writeFileSync(
    resolve(dataDir, "flashcards.ts"),
    `${BANNER("content/flashcards.md")}
import type { DomainKey } from "./quiz";

export type Flashcard = {
  id: string;
  domain: DomainKey;
  topic: string;
  front: string;
  back: string;
};

export const flashcards: Flashcard[] = [
${rows}
];
`
  );
  return { count: unique.length, byDomain: unique.reduce((a, c) => ({ ...a, [c.domain]: (a[c.domain] ?? 0) + 1 }), {}) };
}

/* ── PromQL drills ────────────────────────────────────────────────────── */

function buildDrills() {
  const drillFiles = [
    { file: "drills/01-selectors.md", id: "01", shortTitle: "Selectors" },
    { file: "drills/02-rates-and-counters.md", id: "02", shortTitle: "Rates & Counters" },
    { file: "drills/03-aggregation-and-matching.md", id: "03", shortTitle: "Aggregation & Joins" },
    { file: "drills/04-histograms-and-slo.md", id: "04", shortTitle: "Histograms & SLOs" },
  ];

  const sets = [];
  let totalItems = 0;

  for (const entry of drillFiles) {
    const raw = readFileSync(resolve(contentDir, entry.file), "utf8");
    const headingMatch = raw.match(/^#\s+(.*?)$/m);
    const title = headingMatch ? headingMatch[1].trim() : entry.shortTitle;

    const regex = /###\s+(\d+)\.\s+([\s\S]*?)(?=(?:###\s+\d+\.|$))/g;
    const items = [];
    let match;

    while ((match = regex.exec(raw)) !== null) {
      const num = parseInt(match[1], 10);
      const rest = match[2].trim();
      const detailsIdx = rest.indexOf("<details>");
      let prompt = "";
      let details = "";

      if (detailsIdx !== -1) {
        prompt = rest.slice(0, detailsIdx).trim();
        details = rest
          .slice(detailsIdx)
          .replace(/<\/?details>/g, "")
          .replace(/<summary>.*?<\/summary>/g, "")
          .trim();
      } else {
        prompt = rest;
      }

      let query = "";
      let explanation = details;
      const codeMatch = details.match(/```(?:promql|yaml|bash|sh|powershell|)\s*\n([\s\S]*?)\n```/);
      if (codeMatch) {
        query = codeMatch[1].trim();
        explanation = details.replace(codeMatch[0], "").trim();
      }

      items.push({
        id: `${entry.id}-${num}`,
        num,
        prompt,
        query,
        explanation,
      });
    }

    totalItems += items.length;
    sets.push({
      id: entry.id,
      slug: entry.file.replace(/^drills\//, "").replace(/\.md$/, ""),
      title,
      shortTitle: entry.shortTitle,
      items,
    });
  }

  const setCode = JSON.stringify(sets, null, 2);

  writeFileSync(
    resolve(dataDir, "drills.ts"),
    `${BANNER("content/drills/*.md")}
export type DrillItem = {
  id: string;
  num: number;
  prompt: string;
  query?: string;
  explanation: string;
};

export type DrillSet = {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  items: DrillItem[];
};

export const drillSets: DrillSet[] = ${setCode};
`
  );

  return { setsCount: sets.length, itemsCount: totalItems };
}

/* ── run ──────────────────────────────────────────────────────────────── */

const quiz = buildQuiz();
const cards = buildFlashcards();
const drills = buildDrills();
console.log(
  `sync-content: ${quiz.count} questions (${quiz.multi} multi-select) -> lib/data/quiz.ts\n` +
    `sync-content: ${cards.count} flashcards -> lib/data/flashcards.ts ` +
    JSON.stringify(cards.byDomain) +
    `\nsync-content: ${drills.itemsCount} drill items (${drills.setsCount} sets) -> lib/data/drills.ts`
);
