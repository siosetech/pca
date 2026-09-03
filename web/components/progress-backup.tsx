"use client";

import { useRef, useState } from "react";
import { Download, Upload, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const HISTORY_KEY = "pca-quiz-history-v1";
const FLASHCARDS_KEY = "pca-flashcards-v1";

export function ProgressBackup() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ msg: string; err?: boolean } | null>(null);

  const handleExport = () => {
    try {
      const quizHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
      const flashcards = JSON.parse(localStorage.getItem(FLASHCARDS_KEY) ?? "{}");

      const backup = {
        app: "pca-lab",
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          quizHistory,
          flashcards,
        },
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `pca-progress-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const attempts = Array.isArray(quizHistory) ? quizHistory.length : 0;
      const cards = Object.keys(flashcards).length;
      setStatus({ msg: `Exported: ${attempts} exam attempts, ${cards} card reviews.` });
      setTimeout(() => setStatus(null), 4000);
    } catch {
      setStatus({ msg: "Export failed", err: true });
      setTimeout(() => setStatus(null), 4000);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed || typeof parsed !== "object" || parsed.app !== "pca-lab" || !parsed.data) {
          throw new Error("Invalid backup format");
        }

        const quizHistory = parsed.data.quizHistory ?? [];
        const flashcards = parsed.data.flashcards ?? {};

        localStorage.setItem(HISTORY_KEY, JSON.stringify(quizHistory));
        localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(flashcards));

        const attempts = Array.isArray(quizHistory) ? quizHistory.length : 0;
        const cards = Object.keys(flashcards).length;
        setStatus({ msg: `Restored ${attempts} attempts and ${cards} card states. Reloading...` });

        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch {
        setStatus({ msg: "Invalid JSON backup file.", err: true });
        setTimeout(() => setStatus(null), 4000);
      }
    };
    reader.readAsText(file);
    // Reset file input so re-selecting same file triggers onChange
    e.target.value = "";
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
      />

      <Button
        variant="ghost"
        size="xs"
        className="h-7 text-xs text-muted-foreground hover:text-foreground"
        onClick={handleExport}
        title="Download your quiz history and flashcard review intervals as JSON"
      >
        <Download className="size-3.5" />
        Export Progress
      </Button>

      <Button
        variant="ghost"
        size="xs"
        className="h-7 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => fileInputRef.current?.click()}
        title="Restore quiz history and flashcard intervals from a JSON file"
      >
        <Upload className="size-3.5" />
        Import Progress
      </Button>

      {status ? (
        <span
          className={`flex items-center gap-1 font-medium ${
            status.err ? "text-destructive" : "text-emerald-500"
          }`}
        >
          {status.err ? <AlertCircle className="size-3.5" /> : <Check className="size-3.5" />}
          {status.msg}
        </span>
      ) : null}
    </div>
  );
}
