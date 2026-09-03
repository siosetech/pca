"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { quizQuestions } from "@/lib/data/quiz";
import { cn } from "@/lib/utils";

export function QuizExam() {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const q = quizQuestions[index];
  const pct = useMemo(
    () => Math.round(((index + (done ? 1 : 0)) / quizQuestions.length) * 100),
    [index, done],
  );

  function lock() {
    if (picked === null) return;
    setRevealed(true);
    if (picked === q.answer) setScore((s) => s + 1);
  }

  function next() {
    if (index + 1 >= quizQuestions.length) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
    setRevealed(false);
  }

  function restart() {
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
    setRevealed(false);
  }

  if (done) {
    const ratio = score / quizQuestions.length;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sonuç</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-3xl font-medium tabular-nums">
            {score}/{quizQuestions.length}
          </p>
          <p className="text-muted-foreground">
            {ratio >= 0.8
              ? "Güçlü. PromQL ve Alertmanager nüanslarını bir tur daha sıkılaştır."
              : ratio >= 0.66
                ? "PCA geçme eşiği civarı (resmi bar açıklanmıyor, ~%66 spekülasyonu). Zayıf alanları müfredattan aç."
                : "Önce PromQL alıştırmaları ve domain notları, sonra tekrar dene."}
          </p>
          <Button onClick={restart}>Yeniden başlat</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            Soru {index + 1} / {quizQuestions.length} · {q.domain}
          </span>
          <span>
            Skor {score} · İngilizce (sınav dili)
          </span>
        </div>
        <Progress value={pct} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg leading-relaxed">{q.prompt}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {q.options.map((opt, i) => {
            const isAnswer = i === q.answer;
            const isPick = i === picked;
            return (
              <button
                key={opt}
                type="button"
                disabled={revealed}
                onClick={() => setPicked(i)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2.5 text-left text-sm transition",
                  !revealed && isPick && "border-primary bg-primary/15",
                  !revealed && !isPick && "border-border hover:bg-muted/60",
                  revealed && isAnswer && "border-green-600/60 bg-green-950/40",
                  revealed && isPick && !isAnswer && "border-destructive/60 bg-destructive/15",
                )}
              >
                <span className="mr-2 font-mono text-xs text-muted-foreground">
                  {String.fromCharCode(65 + i)}.
                </span>
                {opt}
              </button>
            );
          })}
        </CardContent>
      </Card>

      {revealed ? (
        <div className="space-y-3">
          <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed">
            {q.why}
          </p>
          <Button onClick={next}>
            {index + 1 >= quizQuestions.length ? "Sonucu gör" : "Sonraki"}
          </Button>
        </div>
      ) : (
        <Button disabled={picked === null} onClick={lock}>
          Kilitle
        </Button>
      )}
    </div>
  );
}
