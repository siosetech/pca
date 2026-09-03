import { FlashcardDeck } from "@/components/flashcard-deck";
import { flashcards } from "@/lib/data/flashcards";

export default function FlashcardsPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-medium tracking-tight">Flashcards</h1>
        <p className="text-muted-foreground">
          <span className="font-mono tabular-nums text-foreground">{flashcards.length}</span> cards
          <span className="mx-2 text-border">·</span>
          CNCF curriculum order
          <span className="mx-2 text-border">·</span>
          SM-2, 20 new/day
        </p>
      </header>
      <FlashcardDeck />
    </div>
  );
}
