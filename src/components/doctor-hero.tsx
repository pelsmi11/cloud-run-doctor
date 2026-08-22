import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Hero section for Cloud Run Doctor.
 * Demonstrates technical palette and severity tokens.
 */
export function DoctorHero() {
  return (
    <section className="space-y-6 rounded-lg border bg-card p-8 shadow-sm">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Clear diagnosis for Cloud Run
        </h1>
        <p className="max-w-prose text-muted-foreground">
          Technical, calm and readable — prioritizes logs, evidence and
          recommendations.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary">Investigate</Button>
        <Badge className="bg-healthy text-white">Healthy</Badge>
        <Badge className="bg-warning text-white">Warning</Badge>
        <Badge variant="destructive">Error</Badge>
        <Badge className="bg-evidence text-white">Evidence</Badge>
      </div>

      <Alert className="border-recommended/50 bg-recommended/10">
        <AlertTitle>Recommendation</AlertTitle>
        <AlertDescription>
          This is a static placeholder. No agent logic is implemented yet.
        </AlertDescription>
      </Alert>
    </section>
  );
}
