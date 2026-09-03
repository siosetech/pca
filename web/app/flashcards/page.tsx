import { FlashcardDeck } from "@/components/flashcard-deck";
import { flashcards } from "@/lib/data/flashcards";

export default function FlashcardsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-medium">Flashcards</h1>
        <p className="max-w-2xl leading-relaxed text-muted-foreground">
          {flashcards.length} cards on SM-2, the spaced-repetition algorithm behind Anki. Cards you
          keep missing come back sooner; cards you know drift out to weeks. Ten minutes a day, on
          the days you are not studying, is what keeps the 1–3 day gaps in the plan from eroding
          what you learned.
        </p>
        <p className="max-w-2xl text-sm text-muted-foreground/80">
          Written in <span className="font-mono">content/flashcards.md</span> — add a row to the
          table and it appears here on the next build.
        </p>
      </div>
      <FlashcardDeck />
    </div>
  );
}
