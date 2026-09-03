import { PromqlList } from "@/components/promql-list";

export default function PromqlPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-medium">PromQL Exercises</h1>
        <p className="max-w-2xl text-muted-foreground leading-relaxed">
          Paste queries into the Prometheus Expression browser at{" "}
          <span className="font-mono text-foreground">http://localhost:9090</span>.
          Once the lab is up and loadgen has run for 1–2 minutes, time series
          will populate. Includes extras at the bottom: irate, *_over_time, deriv,
          absent, and group_left.
        </p>
      </div>
      <PromqlList />
    </div>
  );
}
