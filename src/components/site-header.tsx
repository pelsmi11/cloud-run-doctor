import { Badge } from "@/components/ui/badge";

/**
 * Site header for Cloud Run Doctor.
 * Technical, calm and diagnostic — slate base with slate tokens.
 */
export function SiteHeader() {
  return (
    <header className="flex items-center justify-between border-b bg-card px-6 py-4">
      <span className="text-lg font-semibold tracking-tight text-foreground">
        Cloud Run Doctor
      </span>
      <Badge className="bg-evidence text-white">Evidence</Badge>
    </header>
  );
}
