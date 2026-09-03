import { QuizExam } from "@/components/quiz-exam";

export default function QuizPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-medium">Practice Exam</h1>
        <p className="max-w-2xl text-muted-foreground leading-relaxed">
          28 multiple-choice questions aligned with the official PCA format.
          Untimed for practice; the actual exam is 90 minutes and closed-book.
          These questions are not an official question pool. The final 8 questions
          cover extras (heatmap, NFS, SNMP, absent, relabeling).
        </p>
      </div>
      <QuizExam />
    </div>
  );
}
