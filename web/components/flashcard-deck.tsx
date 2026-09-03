"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { flashcards, type Flashcard } from "@/lib/data/flashcards";
import { DOMAINS, type DomainKey } from "@/lib/data/quiz";
import { cn } from "@/lib/utils";

/* ── SM-2 scheduling ──────────────────────────────────────────────────────
 * The algorithm behind Anki. Each card carries an ease factor and an interval;
 * how you grade a recall adjusts both. Getting a card wrong does not just
 * repeat it, it shortens every future interval for that card - which is what
 * makes the deck spend your time on the material you actually keep forgetting.
 * ---------------------------------------------------------------------- */

const STORE_KEY = "pca-flashcards-v1";
const DAY = 86_400_000;
const NEW_PER_DAY = 20;
const MIN_EASE = 1.3;

type Grade = 0 | 1 | 2 | 3; // Again, Hard, Good, Easy
type CardState = {
  ease: number;
  interval: number; // days
  reps: number;
  lapses: number;
  due: number; // epoch ms
};
type Store = Record<string, CardState>;

const FRESH: CardState = { ease: 2.5, interval: 0, reps: 0, lapses: 0, due: 0 };

function schedule(state: CardState, grade: Grade, now: number): CardState {
  const s = { ...state };
  if (grade === 0) {
    s.reps = 0;
    s.lapses += 1;
    s.ease = Math.max(MIN_EASE, s.ease - 0.2);
    s.interval = 0;
    s.due = now; // back into today's queue
    return s;
  }
  if (grade === 1) s.ease = Math.max(MIN_EASE, s.ease - 0.15);
  if (grade === 3) s.ease = s.ease + 0.15;

  if (s.reps === 0) s.interval = grade === 1 ? 1 : grade === 2 ? 1 : 4;
  else if (s.reps === 1) s.interval = grade === 1 ? 3 : grade === 2 ? 6 : 8;
  else {
    const mult = grade === 1 ? 1.2 : grade === 3 ? s.ease * 1.3 : s.ease;
    s.interval = Math.max(1, Math.round(s.interval * mult));
  }
  s.reps += 1;
  s.due = now + s.interval * DAY;
  return s;
}

/** What the button should promise, in Anki's style. */
function preview(state: CardState, grade: Grade, now: number): string {
  const next = schedule(state, grade, now);
  if (next.interval === 0) return "<1m";
  if (next.interval === 1) return "1d";
  if (next.interval < 30) return `${next.interval}d`;
  if (next.interval < 365) return `${Math.round(next.interval / 30)}mo`;
  return `${(next.interval / 365).toFixed(1)}y`;
}

function load(): Store {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? "{}") as Store;
  } catch {
    return {};
  }
}
function persist(store: Store) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    /* private window or storage blocked - the session still works, it just
       will not be remembered */
  }
}

/* ── tiny inline markdown ─────────────────────────────────────────────────
 * The cards come from a markdown table, so they carry `code` and **bold**.
 * Rendering those two is worth 20 lines; pulling in a markdown library for it
 * would not be.
 * ---------------------------------------------------------------------- */

function RichText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("`")) {
      parts.push(
        <code
          key={k++}
          className="rounded border border-border bg-muted/60 px-1 py-0.5 font-mono text-[0.9em]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else {
      parts.push(
        <strong key={k++} className="font-medium text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    }
    last = m.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

/* ── component ────────────────────────────────────────────────────────── */

const GRADES: { grade: Grade; label: string; key: string; tone: string }[] = [
  { grade: 0, label: "Again", key: "1", tone: "border-destructive/50 text-destructive hover:bg-destructive/10" },
  { grade: 1, label: "Hard", key: "2", tone: "border-amber-500/50 text-amber-500 hover:bg-amber-500/10" },
  { grade: 2, label: "Good", key: "3", tone: "border-green-600/50 text-green-500 hover:bg-green-600/10" },
  { grade: 3, label: "Easy", key: "4", tone: "border-primary/50 text-primary hover:bg-primary/10" },
];

export function FlashcardDeck() {
  const [store, setStore] = useState<Store>({});
  const [ready, setReady] = useState(false);
  const [decks, setDecks] = useState<DomainKey[]>(DOMAINS.map((d) => d.key));
  const [queue, setQueue] = useState<string[] | null>(null);
  const [shown, setShown] = useState(false);
  const [counts, setCounts] = useState({ again: 0, good: 0 });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setStore(load());
    setNow(Date.now());
    setReady(true);
  }, []);

  const byId = useMemo(() => new Map(flashcards.map((c) => [c.id, c])), []);
  const pool = useMemo(() => flashcards.filter((c) => decks.includes(c.domain)), [decks]);

  const stats = useMemo(() => {
    let due = 0;
    let fresh = 0;
    let learned = 0;
    for (const c of pool) {
      const s = store[c.id];
      if (!s || s.reps === 0) {
        if (!s) fresh++;
        else due++;
      } else if (s.due <= now) due++;
      else learned++;
    }
    return { due, fresh, learned, total: pool.length };
  }, [pool, store, now]);

  const startSession = useCallback(() => {
    const t = Date.now();
    const dueIds: string[] = [];
    const newIds: string[] = [];
    for (const c of pool) {
      const s = store[c.id];
      if (!s) newIds.push(c.id);
      else if (s.due <= t) dueIds.push(c.id);
    }
    const shuffled = [...dueIds].sort(() => Math.random() - 0.5);
    setQueue([...shuffled, ...newIds.slice(0, NEW_PER_DAY)]);
    setCounts({ again: 0, good: 0 });
    setShown(false);
    setNow(t);
  }, [pool, store]);

  const grade = useCallback(
    (g: Grade) => {
      if (!queue?.length) return;
      const id = queue[0];
      const t = Date.now();
      const next = schedule(store[id] ?? FRESH, g, t);
      const nextStore = { ...store, [id]: next };
      setStore(nextStore);
      persist(nextStore);
      setCounts((c) => (g === 0 ? { ...c, again: c.again + 1 } : { ...c, good: c.good + 1 }));
      // Again puts the card back a few positions later, the way Anki does
      setQueue((q) => {
        if (!q) return q;
        const [head, ...rest] = q;
        if (g === 0) {
          const at = Math.min(rest.length, 4);
          return [...rest.slice(0, at), head, ...rest.slice(at)];
        }
        return rest;
      });
      setShown(false);
      setNow(t);
    },
    [queue, store]
  );

  const active: Flashcard | null = queue?.length ? byId.get(queue[0]) ?? null : null;

  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!shown) {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          setShown(true);
        }
        return;
      }
      const hit = GRADES.find((g) => g.key === e.key);
      if (hit) {
        e.preventDefault();
        grade(hit.grade);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, shown, grade]);

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Loading your review schedule…</p>;
  }

  /* ── session finished ───────────────────────────────────────────────── */
  if (queue && !queue.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session complete</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {counts.good + counts.again} reviews · {counts.again} needed a second look.{" "}
            {stats.due > 0
              ? `${stats.due} still due.`
              : "Nothing else is due today — the rest is scheduled."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={startSession} disabled={stats.due + stats.fresh === 0}>
              {stats.due + stats.fresh === 0 ? "All caught up" : "Keep going"}
            </Button>
            <Button variant="outline" onClick={() => setQueue(null)}>
              Back to deck
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  /* ── reviewing ──────────────────────────────────────────────────────── */
  if (active) {
    const state = store[active.id] ?? FRESH;
    const done = counts.good + counts.again;
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge variant="outline">
              {DOMAINS.find((d) => d.key === active.domain)?.label ?? active.domain}
            </Badge>
            {state.reps === 0 ? (
              <span className="font-mono text-xs text-primary">new</span>
            ) : (
              <span className="font-mono text-xs text-muted-foreground">
                seen {state.reps}× · ease {state.ease.toFixed(2)}
                {state.lapses > 0 && ` · ${state.lapses} lapse${state.lapses > 1 ? "s" : ""}`}
              </span>
            )}
            <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
              {queue!.length} left
            </span>
          </div>
          <Progress value={done ? (done / (done + queue!.length)) * 100 : 0} />
        </div>

        <Card
          className={cn("min-h-56 cursor-pointer transition", !shown && "hover:border-muted-foreground/50")}
          onClick={() => !shown && setShown(true)}
        >
          <CardContent className="space-y-5 pt-8">
            <p className="text-xl leading-relaxed">
              <RichText text={active.front} />
            </p>
            {shown && (
              <>
                <Separator />
                <p className="leading-relaxed text-muted-foreground">
                  <RichText text={active.back} />
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {shown ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GRADES.map((g) => (
                <button
                  key={g.grade}
                  type="button"
                  onClick={() => grade(g.grade)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-md border py-2.5 text-sm transition",
                    g.tone
                  )}
                >
                  <span className="font-medium">{g.label}</span>
                  <span className="font-mono text-xs opacity-70">
                    {preview(state, g.grade, now)}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-center font-mono text-xs text-muted-foreground">
              1 Again · 2 Hard · 3 Good · 4 Easy
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Button className="w-full" onClick={() => setShown(true)}>
              Show answer
            </Button>
            <p className="text-center font-mono text-xs text-muted-foreground">space or enter</p>
          </div>
        )}
      </div>
    );
  }

  /* ── deck overview ──────────────────────────────────────────────────── */
  const nothingDue = stats.due + stats.fresh === 0;
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat value={stats.due} label="due" tone="text-amber-500" />
            <Stat value={Math.min(stats.fresh, NEW_PER_DAY)} label="new" tone="text-primary" />
            <Stat value={stats.learned} label="scheduled" tone="text-green-500" />
            <Stat value={stats.total} label="in deck" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Decks</p>
            <div className="flex flex-wrap gap-2">
              {DOMAINS.map((d) => {
                const n = flashcards.filter((c) => c.domain === d.key).length;
                const on = decks.includes(d.key);
                return (
                  <button
                    key={d.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setDecks((cur) =>
                        cur.includes(d.key)
                          ? cur.filter((k) => k !== d.key)
                          : DOMAINS.map((x) => x.key).filter((k) => cur.includes(k) || k === d.key)
                      )
                    }
                    className={cn(
                      "rounded-md border px-3.5 py-2 text-sm transition",
                      on
                        ? "border-foreground font-medium ring-1 ring-foreground/30"
                        : "border-border text-muted-foreground hover:bg-muted/60"
                    )}
                  >
                    {d.label}
                    <span className="ml-2 font-mono text-xs opacity-60">{n}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={startSession} disabled={nothingDue || !decks.length}>
              {nothingDue ? "Nothing due" : `Review ${Math.min(stats.due + stats.fresh, stats.due + NEW_PER_DAY)}`}
            </Button>
            {nothingDue && (
              <span className="text-sm text-muted-foreground">
                Everything is scheduled for a later day. That is the algorithm working.
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How the scheduling works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            SM-2, the algorithm behind Anki. Every card carries an{" "}
            <span className="font-mono text-foreground">ease</span> factor and an interval. Grading a
            card <strong className="font-medium text-foreground">Good</strong> multiplies its
            interval by the ease; <strong className="font-medium text-foreground">Again</strong>{" "}
            resets the interval and permanently lowers the ease, so a card you keep forgetting keeps
            coming back sooner than one you do not.
          </p>
          <p>
            That is the whole point: the deck spends your ten minutes on the material you are
            actually losing, rather than the material you already know. New cards are capped at{" "}
            {NEW_PER_DAY} a day so the review load does not compound.
          </p>
          <p>
            Progress lives in this browser only. Cards are keyed by the text of the question, so
            reordering{" "}
            <span className="font-mono text-foreground">content/flashcards.md</span> never loses your
            history — but rewording a question starts that card over.
          </p>
          {stats.learned > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStore({});
                persist({});
                setQueue(null);
              }}
            >
              Reset all progress
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ value, label, tone }: { value: number; label: string; tone?: string }) {
  return (
    <div className="space-y-0.5">
      <p className={cn("font-mono text-3xl font-medium tabular-nums", tone)}>{value}</p>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
