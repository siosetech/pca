import { QuizExam } from "@/components/quiz-exam";
import { quizQuestions } from "@/lib/data/quiz";

export default function QuizPage() {
  const spare = quizQuestions.filter((q) => q.form === null).length;
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-medium">Practice Exam</h1>
        <p className="max-w-2xl leading-relaxed text-muted-foreground">
          Two fixed papers of 60 questions each, both drawn to the official CNCF domain weights and
          written to the same difficulty — sixty questions in ninety minutes, 75% to pass, the same
          shape as the real thing. Sit Exam A now and Exam B a week later, and the gap between the
          two scores means something, because neither paper shares a question with the other.
        </p>
        <p className="max-w-2xl leading-relaxed text-muted-foreground">
          A further {spare} questions sit in neither paper. Practice draws from those by default, so
          drilling on a Tuesday cannot quietly inflate the mock you sit on Saturday.
        </p>
        <p className="max-w-2xl text-sm text-muted-foreground/80">
          {quizQuestions.length} questions in total, and none of them official. Every one links back
          to the note in <span className="font-mono">content/notes/</span> that should have covered
          it — if a miss has no home there, that is a gap in the notes rather than in your memory.
        </p>
      </div>
      <QuizExam />
    </div>
  );
}
