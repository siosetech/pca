"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  DOMAINS,
  PASS_RATIO,
  SECONDS_PER_QUESTION,
  quizQuestions,
  type DomainKey,
  type QuizQuestion,
} from "@/lib/data/quiz";
import { cn } from "@/lib/utils";

/* ── helpers ──────────────────────────────────────────────────────────── */

const LETTERS = ["A", "B", "C", "D"];
const HISTORY_KEY = "pca-quiz-history-v1";

type Mode = "exam" | "practice";
type Phase = "setup" | "exam" | "results";
type Paper = "A" | "B" | "practice";
type Item = QuizQuestion & { shuffled: string[]; correct: number[] };
type Attempt = { date: string; pct: number; count: number; mode: Mode; paper: Paper };

const PAPERS: { key: Paper; title: string; blurb: string }[] = [
  {
    key: "A",
    title: "Exam A",
    blurb:
      "A fixed 60-question paper, timed. The same questions every time, so a retake is directly comparable with your first score.",
  },
  {
    key: "B",
    title: "Exam B",
    blurb:
      "A second fixed paper of 60 different questions, drawn to the same weights and written to the same difficulty.",
  },
  {
    key: "practice",
    title: "Practice",
    blurb:
      "Draw from the questions that are in neither paper, so drilling never spoils a mock. Choose the length, the domains, and whether it is timed.",
  },
];

function shuffle<T>(input: T[]): T[] {
  const a = input.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Largest-remainder allocation, so any exam length keeps the official domain
 * weights. 60 questions gives 11 / 12 / 17 / 9 / 11.
 */
function allocate(total: number, keys: DomainKey[]): Record<string, number> {
  const doms = DOMAINS.filter((d) => keys.includes(d.key));
  const sum = doms.reduce((s, d) => s + d.weight, 0);
  const raw = doms.map((d) => (total * d.weight) / sum);
  const base = raw.map(Math.floor);
  let left = total - base.reduce((a, b) => a + b, 0);
  raw
    .map((v, i) => [v - base[i], i] as const)
    .sort((a, b) => b[0] - a[0])
    .forEach(([, i]) => {
      if (left > 0) {
        base[i]++;
        left--;
      }
    });
  return Object.fromEntries(doms.map((d, i) => [d.key, base[i]]));
}

function dress(picked: QuizQuestion[]): Item[] {
  return shuffle(picked).map((q) => {
    // never leave the answer where the author put it
    const order = shuffle(q.options.map((_, i) => i));
    return {
      ...q,
      shuffled: order.map((i) => q.options[i]),
      correct: q.answers.map((a) => order.indexOf(a)).sort((x, y) => x - y),
    };
  });
}

/** A fixed paper: the same 60 questions every attempt, order and options reshuffled. */
function buildPaper(paper: "A" | "B"): Item[] {
  return dress(quizQuestions.filter((q) => q.form === paper));
}

/** Practice: a weighted draw from whichever pool the learner chose. */
function buildPractice(count: number, keys: DomainKey[], includePapers: boolean): Item[] {
  const source = quizQuestions.filter((q) => includePapers || q.form === null);
  const quota = allocate(count, keys);
  let picked: QuizQuestion[] = [];
  for (const key of keys) {
    const pool = shuffle(source.filter((q) => q.domain === key));
    picked = picked.concat(pool.slice(0, Math.min(quota[key] ?? 0, pool.length)));
  }
  return dress(picked);
}

const mmss = (s: number) => {
  const v = Math.max(0, Math.round(s));
  return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
};
const same = (a: number[], b: number[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);
const label = (k: DomainKey) => DOMAINS.find((d) => d.key === k)?.label ?? k;

function readHistory(): Attempt[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as Attempt[];
  } catch {
    return [];
  }
}
function saveAttempt(a: Attempt) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([a, ...readHistory()].slice(0, 12)));
  } catch {
    /* private window or storage blocked - the result still shows on screen */
  }
}

/* ── component ────────────────────────────────────────────────────────── */

export function QuizExam() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [paper, setPaper] = useState<Paper>("A");
  const [mode, setMode] = useState<Mode>("exam");
  const [count, setCount] = useState(30);
  const [includePapers, setIncludePapers] = useState(false);
  const [domains, setDomains] = useState<DomainKey[]>(DOMAINS.map((d) => d.key));

  const [items, setItems] = useState<Item[]>([]);
  const [picks, setPicks] = useState<number[][]>([]);
  const [flags, setFlags] = useState<boolean[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [filter, setFilter] = useState<"all" | "wrong" | "flag">("all");

  const [startedAt, setStartedAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [now, setNow] = useState(0);
  const [history, setHistory] = useState<Attempt[]>([]);
  const finishRef = useRef<() => void>(() => {});

  useEffect(() => setHistory(readHistory()), []);

  const poolSize = useMemo(
    () => quizQuestions.filter((q) => includePapers || q.form === null).length,
    [includePapers]
  );
  const practiceCount = Math.min(count, poolSize);
  const quota = useMemo(() => allocate(practiceCount, domains), [practiceCount, domains]);
  /** Fixed papers are always timed; only practice may be untimed. */
  const timed = paper !== "practice" || mode === "exam";
  const deadline = startedAt + items.length * SECONDS_PER_QUESTION * 1000;

  /* one ticking clock, only while an exam is running */
  useEffect(() => {
    if (phase !== "exam") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    setNow(Date.now());
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase === "exam" && timed && now && now >= deadline) finishRef.current();
  }, [now, deadline, phase, timed]);

  const start = useCallback(
    (questions: Item[]) => {
      setItems(questions);
      setPicks(questions.map(() => []));
      setFlags(questions.map(() => false));
      setIdx(0);
      setRevealed(false);
      setConfirmFinish(false);
      setNavOpen(false);
      setStartedAt(Date.now());
      setNow(Date.now());
      setPhase("exam");
    },
    [],
  );

  const result = useMemo(() => {
    const rows = items.map((q, i) => ({
      q,
      i,
      picked: picks[i] ?? [],
      ok: same(picks[i] ?? [], q.correct),
    }));
    const right = rows.filter((r) => r.ok).length;
    const per: Record<string, { total: number; right: number }> = {};
    for (const d of DOMAINS) {
      const sub = rows.filter((r) => r.q.domain === d.key);
      if (sub.length) per[d.key] = { total: sub.length, right: sub.filter((r) => r.ok).length };
    }
    return {
      rows,
      right,
      total: rows.length || 1,
      pct: Math.round((right / (rows.length || 1)) * 100),
      per,
    };
  }, [items, picks]);

  const finish = useCallback(() => {
    setElapsed((Date.now() - startedAt) / 1000);
    const pct = Math.round(
      (items.filter((q, i) => same(picks[i] ?? [], q.correct)).length / (items.length || 1)) * 100,
    );
    const attempt: Attempt = {
      date: new Date().toLocaleString(),
      pct,
      count: items.length,
      mode,
      paper,
    };
    saveAttempt(attempt);
    setHistory((h) => [attempt, ...h].slice(0, 12));
    setNavOpen(false);
    setFilter("all");
    setPhase("results");
  }, [items, picks, startedAt, mode, paper]);
  finishRef.current = finish;

  const go = useCallback(
    (n: number) => {
      setIdx((prev) => Math.max(0, Math.min(items.length - 1, n)) || 0);
      setRevealed(false);
      setConfirmFinish(false);
      if (typeof window !== "undefined") window.scrollTo(0, 0);
    },
    [items.length],
  );

  const choose = useCallback(
    (option: number) => {
      if (revealed) return;
      setPicks((prev) => {
        const next = prev.slice();
        const q = items[idx];
        const cur = next[idx] ?? [];
        if (q.type === "multi") {
          next[idx] = cur.includes(option)
            ? cur.filter((x) => x !== option)
            : cur.length < q.correct.length
              ? [...cur, option].sort((a, b) => a - b)
              : cur;
        } else {
          next[idx] = cur.includes(option) ? [] : [option];
        }
        return next;
      });
    },
    [idx, items, revealed],
  );

  /* keyboard: 1-4 or A-D to answer, arrows to move, F to flag */
  useEffect(() => {
    if (phase !== "exam") return;
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k >= "1" && k <= "4") { e.preventDefault(); choose(Number(k) - 1); }
      else if ("abcd".includes(k) && k.length === 1) { e.preventDefault(); choose("abcd".indexOf(k)); }
      else if (e.key === "ArrowRight") { e.preventDefault(); go(idx + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(idx - 1); }
      else if (k === "f") { e.preventDefault(); setFlags((f) => f.map((v, i) => (i === idx ? !v : v))); }
      else if (k === "n") { e.preventDefault(); setNavOpen((v) => !v); }
      else if (e.key === "Escape") setNavOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, idx, choose, go]);

  /* ── setup ──────────────────────────────────────────────────────────── */

  if (phase === "setup") {
    const isPaper = paper !== "practice";
    const paperItems = isPaper ? quizQuestions.filter((q) => q.form === paper) : [];
    const drawCount = isPaper ? paperItems.length : practiceCount;
    const minutes = Math.round((drawCount * SECONDS_PER_QUESTION) / 60);
    const paperQuota = isPaper
      ? paperItems.reduce<Record<string, number>>(
          (a, q) => ({ ...a, [q.domain]: (a[q.domain] ?? 0) + 1 }),
          {}
        )
      : quota;
    const shownDomains = isPaper ? DOMAINS.map((d) => d.key) : domains;
    const best = history.filter((h) => h.paper === paper).reduce((m, h) => Math.max(m, h.pct), -1);

    return (
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {PAPERS.map((p) => {
            const on = paper === p.key;
            const attempts = history.filter((h) => h.paper === p.key).length;
            return (
              <button
                key={p.key}
                type="button"
                aria-pressed={on}
                onClick={() => setPaper(p.key)}
                className={cn(
                  "rounded-lg border p-4 text-left transition",
                  on
                    ? "border-foreground ring-1 ring-foreground/30"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-medium">{p.title}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {p.key === "practice"
                      ? `${quizQuestions.filter((q) => q.form === null).length} spare`
                      : "60 q · 90 min"}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.blurb}</p>
                {attempts > 0 && (
                  <p className="mt-2 font-mono text-xs text-muted-foreground/70">
                    {attempts} attempt{attempts > 1 ? "s" : ""}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isPaper ? `Exam ${paper}` : "Set up the practice run"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isPaper ? (
              <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
                Sixty fixed questions under exam conditions: no feedback until you submit, and the
                clock does not stop. The question order and the answer positions are reshuffled on
                every attempt, so you cannot learn the paper by position — only by knowing it.
                {best >= 0 && (
                  <>
                    {" "}
                    Your best on this paper so far is{" "}
                    <span className="font-mono text-foreground">{best}%</span>.
                  </>
                )}
              </p>
            ) : (
              <>
                <Field label="Timing">
                  <Choice active={mode === "exam"} onClick={() => setMode("exam")}>
                    Timed — results at the end
                  </Choice>
                  <Choice active={mode === "practice"} onClick={() => setMode("practice")}>
                    Untimed — answer shown as you go
                  </Choice>
                </Field>

                <Field label="Length">
                  {[60, 30, 15].map((n) => (
                    <Choice key={n} active={count === n} onClick={() => setCount(n)}>
                      {n} questions
                    </Choice>
                  ))}
                </Field>

                <Field
                  label="Draw from"
                  hint="By default practice uses only the questions that are in neither paper, so drilling cannot inflate a later mock score."
                >
                  <Choice active={!includePapers} onClick={() => setIncludePapers(false)}>
                    Spare pool only ({quizQuestions.filter((q) => q.form === null).length})
                  </Choice>
                  <Choice active={includePapers} onClick={() => setIncludePapers(true)}>
                    Everything ({quizQuestions.length})
                  </Choice>
                </Field>

                <Field
                  label="Domains"
                  hint="Deselect a domain to drill only what is weak. Weights are re-normalised across what is left."
                >
                  {DOMAINS.map((d) => (
                    <Choice
                      key={d.key}
                      active={domains.includes(d.key)}
                      onClick={() =>
                        setDomains((cur) =>
                          cur.includes(d.key)
                            ? cur.filter((k) => k !== d.key)
                            : DOMAINS.map((x) => x.key).filter((k) => cur.includes(k) || k === d.key),
                        )
                      }
                    >
                      {d.label}
                    </Choice>
                  ))}
                </Field>
              </>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">This attempt will draw</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 text-left font-medium">Domain</th>
                    <th className="pb-2 text-right font-medium">Exam weight</th>
                    <th className="pb-2 text-right font-medium">Questions</th>
                  </tr>
                </thead>
                <tbody>
                  {DOMAINS.filter((d) => shownDomains.includes(d.key)).map((d) => (
                    <tr key={d.key} className="border-t border-border">
                      <td className="py-1.5">{d.label}</td>
                      <td className="py-1.5 text-right font-mono text-muted-foreground">
                        {Math.round(d.weight * 100)}%
                      </td>
                      <td className="py-1.5 text-right font-mono tabular-nums">
                        {paperQuota[d.key] ?? 0}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-border font-medium">
                    <td className="py-1.5">Total</td>
                    <td className="py-1.5 text-right font-mono text-muted-foreground">
                      {timed ? `${minutes} min` : "untimed"}
                    </td>
                    <td className="py-1.5 text-right font-mono tabular-nums">{drawCount}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                disabled={!isPaper && (!domains.length || practiceCount === 0)}
                onClick={() =>
                  start(
                    isPaper
                      ? buildPaper(paper)
                      : buildPractice(practiceCount, domains, includePapers)
                  )
                }
              >
                {isPaper ? `Start exam ${paper}` : "Start practice"}
              </Button>
              <span className="font-mono text-xs text-muted-foreground">
                1–4 answer · ← → move · F flag · N navigator
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attempt history</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length ? (
              <div className="divide-y divide-border">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 text-sm">
                    <Badge variant={h.pct >= PASS_RATIO * 100 ? "default" : "destructive"}>
                      {h.pct >= PASS_RATIO * 100 ? "pass" : "fail"}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground">
                      {h.paper === "practice" ? "practice" : `exam ${h.paper}`} · {h.date} ·{" "}
                      {h.count} q
                    </span>
                    <span className="ml-auto font-mono font-medium tabular-nums">{h.pct}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No attempts yet. The readiness bar is two consecutive runs at 85% or better, with no
                single domain below 75%.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ── results ────────────────────────────────────────────────────────── */

  if (phase === "results") {
    const passed = result.pct >= PASS_RATIO * 100;
    const budget = Math.floor(result.total * (1 - PASS_RATIO));
    const missed = result.total - result.right;
    const rows =
      filter === "wrong"
        ? result.rows.filter((r) => !r.ok)
        : filter === "flag"
          ? result.rows.filter((r) => flags[r.i])
          : result.rows;

    return (
      <div className="space-y-8">
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div className="flex flex-wrap items-end gap-5">
              <span
                className={cn(
                  "font-mono text-6xl font-medium leading-none tabular-nums",
                  passed ? "text-green-500" : "text-destructive",
                )}
              >
                {result.pct}
                <span className="text-2xl">%</span>
              </span>
              <div className="space-y-1 pb-1">
                <p className="font-medium">
                  {result.right} of {result.total} correct · {passed ? "above" : "below"} the{" "}
                  {Math.round(PASS_RATIO * 100)}% pass mark
                </p>
                <p className="text-sm text-muted-foreground">
                  {paper === "practice" ? "Practice" : `Exam ${paper}`} ·{" "}
                  {timed ? "timed" : "untimed"} · {mmss(elapsed)} elapsed
                  {timed && ` of ${mmss(items.length * SECONDS_PER_QUESTION)}`}
                </p>
              </div>
            </div>

            <div>
              <div className="relative h-6 overflow-hidden rounded-md border border-border bg-muted/40">
                <div
                  className={cn("h-full", passed ? "bg-green-600/70" : "bg-destructive/70")}
                  style={{ width: `${result.pct}%` }}
                />
                <div
                  className="absolute inset-y-0 w-0.5 bg-foreground"
                  style={{ left: `${PASS_RATIO * 100}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between font-mono text-xs text-muted-foreground">
                <span>0%</span>
                <span>pass {Math.round(PASS_RATIO * 100)}%</span>
                <span>100%</span>
              </div>
              <p className="mt-3 max-w-prose text-sm text-muted-foreground">
                Think of it as an error budget: {budget} wrong answers were affordable, and you spent{" "}
                {missed}.{" "}
                {passed
                  ? missed <= budget - 3
                    ? "Comfortable margin."
                    : "Over the line, but with little room to spare."
                  : `Over budget by ${missed - budget}.`}
              </p>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-3">
          <div className="flex items-baseline gap-3">
            <h2 className="text-lg font-medium">By domain</h2>
            <span className="text-sm text-muted-foreground">
              the line marks {Math.round(PASS_RATIO * 100)}%
            </span>
          </div>
          <Card>
            <CardContent className="space-y-4 pt-6">
              {DOMAINS.filter((d) => result.per[d.key]).map((d) => {
                const p = result.per[d.key];
                const pct = Math.round((p.right / p.total) * 100);
                return (
                  <div key={d.key} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span>
                        {d.label}
                        <span className="ml-2 font-mono text-xs text-muted-foreground">
                          {Math.round(d.weight * 100)}% of exam
                        </span>
                      </span>
                      <span className="font-mono tabular-nums text-muted-foreground">
                        {p.right}/{p.total} · {pct}%
                      </span>
                    </div>
                    <div className="relative h-2 overflow-hidden rounded-full border border-border bg-muted/40">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          pct >= 75 ? "bg-green-600" : pct >= 60 ? "bg-amber-500" : "bg-destructive",
                        )}
                        style={{ width: `${pct}%` }}
                      />
                      <div className="absolute inset-y-0 left-[75%] w-px bg-foreground/40" />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <div className="flex items-baseline gap-3">
            <h2 className="text-lg font-medium">Review</h2>
            <span className="text-sm text-muted-foreground">
              every question, with the reasoning and where it is covered
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Choice active={filter === "all"} onClick={() => setFilter("all")}>
              All {result.total}
            </Choice>
            <Choice active={filter === "wrong"} onClick={() => setFilter("wrong")}>
              Missed {missed}
            </Choice>
            <Choice active={filter === "flag"} onClick={() => setFilter("flag")}>
              Flagged {flags.filter(Boolean).length}
            </Choice>
          </div>
          <div className="space-y-3">
            {rows.length ? (
              rows.map((r) => (
                <Card
                  key={r.i}
                  className={cn(
                    "border-l-2",
                    r.ok ? "border-l-green-600" : "border-l-destructive",
                  )}
                >
                  <CardContent className="space-y-3 pt-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {String(r.i + 1).padStart(2, "0")}
                      </span>
                      <Badge variant="outline">{label(r.q.domain)}</Badge>
                      <Badge variant={r.ok ? "default" : "destructive"}>
                        {r.ok ? "correct" : "missed"}
                      </Badge>
                      {flags[r.i] && <Badge variant="outline">flagged</Badge>}
                    </div>
                    <p className="font-medium leading-relaxed">{r.q.prompt}</p>
                    <div className="space-y-1 text-sm">
                      <AnswerRow
                        label="You"
                        values={r.picked.map((i) => `${LETTERS[i]}. ${r.q.shuffled[i]}`)}
                        empty="no answer"
                      />
                      {!r.ok && (
                        <AnswerRow
                          label="Correct"
                          values={r.q.correct.map((i) => `${LETTERS[i]}. ${r.q.shuffled[i]}`)}
                        />
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{r.q.why}</p>
                    {r.q.ref && (
                      <p className="font-mono text-xs text-muted-foreground/70">{r.q.ref}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nothing in this filter.</p>
            )}
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setPhase("setup")}>New attempt</Button>
          <Button
            variant="outline"
            disabled={missed === 0}
            onClick={() => start(dress(result.rows.filter((r) => !r.ok).map((r) => r.q)))}
          >
            Retry the {missed} I missed
          </Button>
        </div>
      </div>
    );
  }

  /* ── exam ───────────────────────────────────────────────────────────── */

  const q = items[idx];
  const picked = picks[idx] ?? [];
  const graded = revealed && !timed;
  const correct = graded && same(picked, q.correct);
  const left = timed
    ? (deadline - (now || Date.now())) / 1000
    : ((now || Date.now()) - startedAt) / 1000;
  const answered = picks.filter((p) => p.length).length;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-mono text-xs text-muted-foreground">
            Question {idx + 1} of {items.length}
          </span>
          <Badge variant="outline">{label(q.domain)}</Badge>
          {flags[idx] && <Badge variant="outline">flagged</Badge>}
          <span
            className={cn(
              "ml-auto font-mono text-base tabular-nums",
              timed && left < 300 && "text-destructive",
              timed && left >= 300 && left < 900 && "text-amber-500",
            )}
          >
            {mmss(left)}
          </span>
          <Button variant="outline" size="sm" onClick={() => setNavOpen(true)}>
            Navigator
          </Button>
        </div>
        <Progress value={((idx + 1) / items.length) * 100} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg leading-relaxed">{q.prompt}</CardTitle>
          {q.type === "multi" && (
            <p className="text-sm font-medium text-amber-500">
              Select {q.correct.length} answers.
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {q.shuffled.map((opt, i) => {
            const isCorrect = q.correct.includes(i);
            const isPick = picked.includes(i);
            return (
              <button
                key={opt}
                type="button"
                disabled={graded}
                onClick={() => choose(i)}
                aria-pressed={isPick}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition",
                  !graded && isPick && "border-primary bg-primary/15",
                  !graded && !isPick && "border-border hover:bg-muted/60",
                  graded && isCorrect && "border-green-600/60 bg-green-950/40",
                  graded && isPick && !isCorrect && "border-destructive/60 bg-destructive/15",
                )}
              >
                <span className="mt-px font-mono text-xs text-muted-foreground">{LETTERS[i]}.</span>
                <span className="leading-relaxed">{opt}</span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {graded && (
        <div
          className={cn(
            "space-y-2 border-l-2 pl-4",
            correct ? "border-green-600" : "border-destructive",
          )}
        >
          <p
            className={cn(
              "font-mono text-xs uppercase tracking-wide",
              correct ? "text-green-500" : "text-destructive",
            )}
          >
            {correct ? "Correct" : "Not quite"}
          </p>
          <p className="text-sm leading-relaxed">{q.why}</p>
          {q.ref && <p className="font-mono text-xs text-muted-foreground/70">{q.ref}</p>}
        </div>
      )}

      <Separator />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" disabled={idx === 0} onClick={() => go(idx - 1)}>
          ← Previous
        </Button>
        <Button
          variant="outline"
          onClick={() => setFlags((f) => f.map((v, i) => (i === idx ? !v : v)))}
        >
          {flags[idx] ? "Unflag" : "Flag for review"}
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {confirmFinish ? (
            <>
              <span className="font-mono text-xs text-amber-500">
                {items.length - answered} unanswered
              </span>
              <Button variant="outline" onClick={() => setConfirmFinish(false)}>
                Keep going
              </Button>
              <Button onClick={finish}>Score anyway</Button>
            </>
          ) : !timed && !revealed ? (
            <Button disabled={!picked.length} onClick={() => setRevealed(true)}>
              Check answer
            </Button>
          ) : idx === items.length - 1 ? (
            <Button
              onClick={() => (answered < items.length ? setConfirmFinish(true) : finish())}
            >
              Finish &amp; score
            </Button>
          ) : (
            <Button onClick={() => go(idx + 1)}>Next →</Button>
          )}
        </div>
      </div>

      {navOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-6"
          role="dialog"
          aria-label="Question navigator"
          onClick={() => setNavOpen(false)}
        >
          <Card className="max-h-[85vh] w-full max-w-2xl overflow-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Navigator</CardTitle>
              <span className="text-sm text-muted-foreground">
                {answered} of {items.length} answered
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-2">
                {items.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setNavOpen(false);
                      go(i);
                    }}
                    className={cn(
                      "aspect-square rounded-md border font-mono text-sm transition",
                      picks[i]?.length
                        ? "border-muted-foreground bg-muted/60 font-medium"
                        : "border-border text-muted-foreground",
                      flags[i] && "border-dashed border-amber-500 text-amber-500",
                      i === idx && "border-primary text-primary ring-1 ring-primary",
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>unanswered</span>
                <span className="text-foreground">answered</span>
                <span className="text-amber-500">flagged</span>
                <span className="text-primary">current</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setNavOpen(false)}>
                  Keep going
                </Button>
                <Button
                  className="ml-auto"
                  onClick={() => {
                    setNavOpen(false);
                    answered < items.length ? setConfirmFinish(true) : finish();
                  }}
                >
                  Finish &amp; score
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ── small presentational helpers ─────────────────────────────────────── */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-md border px-3.5 py-2 text-sm transition",
        active
          ? "border-foreground font-medium ring-1 ring-foreground/30"
          : "border-border text-muted-foreground hover:bg-muted/60",
      )}
    >
      {children}
    </button>
  );
}

function AnswerRow({
  label,
  values,
  empty,
}: {
  label: string;
  values: string[];
  empty?: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="w-16 shrink-0 pt-0.5 font-mono text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="space-y-0.5">
        {values.length ? (
          values.map((v) => <span key={v} className="block">{v}</span>)
        ) : (
          <span className="italic text-muted-foreground/70">{empty}</span>
        )}
      </span>
    </div>
  );
}
