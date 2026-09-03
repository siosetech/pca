import { QuizExam } from "@/components/quiz-exam";
import { PASS_RATIO, quizQuestions } from "@/lib/data/quiz";

export default function QuizPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-medium tracking-tight">Practice Exam</h1>
        <p className="text-muted-foreground">
          <span className="font-mono tabular-nums text-foreground">{quizQuestions.length}</span> in
          the bank
          <span className="mx-2 text-border">·</span>
          60 questions, 90 minutes
          <span className="mx-2 text-border">·</span>
          <span className="font-mono tabular-nums text-foreground">{Math.round(PASS_RATIO * 100)}%</span> to
          pass
        </p>
      </header>
      <QuizExam />
    </div>
  );
}
