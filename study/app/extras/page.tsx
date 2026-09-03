import { CopyBlock } from "@/components/copy-block";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { extras } from "@/lib/data/extras";

export default function ExtrasPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-medium">Extras</h1>
        <p className="max-w-2xl text-muted-foreground leading-relaxed">
          Pearson PCA videosunun lab’de ince kalan yerleri: Linux (L11),
          Kubernetes SD (L12), sınav tuzakları (L13), PromQL operatörleri,
          heatmap, metric_relabel. Thanos/HA yok — associate sınavının dışında.
        </p>
      </div>
      <div className="space-y-3">
        {extras.map((e) => (
          <Card key={e.id}>
            <CardHeader>
              <Badge variant="secondary">{e.pearson}</Badge>
              <CardTitle>{e.title}</CardTitle>
              <CardDescription>{e.why}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed">
              <p>{e.body}</p>
              {e.query ? <CopyBlock code={e.query} /> : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
