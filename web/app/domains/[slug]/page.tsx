import { notFound } from "next/navigation";
import { domains, getDomain } from "@/lib/data/domains";

export function generateStaticParams() {
  return domains.map((d) => ({ slug: d.slug }));
}

export default async function DomainPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const domain = getDomain(slug);
  if (!domain) notFound();

  return (
    <article className="space-y-8">
      <header className="space-y-2">
        <p className="font-mono text-sm text-primary">{domain.weight}% · PCA</p>
        <h1 className="text-3xl font-medium">{domain.title}</h1>
        <p className="text-muted-foreground">{domain.subtitle}</p>
      </header>
      {domain.sections.map((s) => (
        <section key={s.heading} className="space-y-2">
          <h2 className="text-xl font-medium">{s.heading}</h2>
          <p className="leading-relaxed text-pretty">{s.body}</p>
          {s.exam ? (
            <p className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-sm leading-relaxed">
              Exam Tip: {s.exam}
            </p>
          ) : null}
        </section>
      ))}
    </article>
  );
}
