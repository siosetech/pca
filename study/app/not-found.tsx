import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="space-y-4 py-16 text-center">
      <h1 className="text-2xl font-medium">Sayfa yok</h1>
      <p className="text-muted-foreground">Bu rota PCA lab’inde tanımlı değil.</p>
      <Button nativeButton={false} render={<Link href="/" />}>
        Ana sayfa
      </Button>
    </div>
  );
}
