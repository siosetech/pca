import { PromqlList } from "@/components/promql-list";

export default function PromqlPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-medium tracking-tight">PromQL</h1>
        <p className="text-muted-foreground">
          28% of the exam
          <span className="mx-2 text-border">·</span>
          <a
            href="http://localhost:9090"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            localhost:9090
          </a>
        </p>
      </header>
      <PromqlList />
    </div>
  );
}
