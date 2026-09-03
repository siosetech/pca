import { QuizExam } from "@/components/quiz-exam";

export default function QuizPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-medium">Deneme sınavı</h1>
        <p className="max-w-2xl text-muted-foreground leading-relaxed">
          28 soru, İngilizce, çoktan seçmeli — resmi PCA formatına yakın. Süre
          yok; gerçek sınav 90 dakika, açık defter değil. Bu sorular resmi havuz
          değildir. Son 8 soru extras (heatmap, NFS, SNMP, absent, relabel).
        </p>
      </div>
      <QuizExam />
    </div>
  );
}
