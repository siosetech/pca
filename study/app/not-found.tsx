import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="space-y-4 py-16 text-center">
      <h1 className="text-2xl font-medium">Page Not Found</h1>
      <p className="text-muted-foreground">This route is not defined in the PCA lab.</p>
      <Button nativeButton={false} render={<Link href="/" />}>
        Home
      </Button>
    </div>
  );
}
