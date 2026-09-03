import { PromqlList } from "@/components/promql-list";

export default function PromqlPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-medium">PromQL alıştırmaları</h1>
        <p className="max-w-2xl text-muted-foreground leading-relaxed">
          Sorguları Prometheus Expression browser’a yapıştır{" "}
          <span className="font-mono text-foreground">http://localhost:9090</span>.
          Lab ayağa kalkıp loadgen 1–2 dakika çalıştıktan sonra seriler dolar.
          Alttaki extras: irate, *_over_time, deriv, absent, group_left.
        </p>
      </div>
      <PromqlList />
    </div>
  );
}
