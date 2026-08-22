import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

/**
 * Evidence preview placeholder for Cloud Run Doctor.
 * Uses ScrollArea, Separator and mono block to demo observability legibility.
 */
export function EvidencePreview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evidence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-40 rounded border bg-muted p-4">
          <pre className="font-mono text-sm text-foreground">
            {`{
  "severity": "INFO",
  "service": "pawpass",
  "event": "PET_REGISTRATION_STARTED",
  "requestId": "REQ-789",
  "route": "/api/pets"
}`}
          </pre>
        </ScrollArea>
        <Separator />
        <Alert>
          <AlertTitle>Next step</AlertTitle>
          <AlertDescription>Check Cloud Logging for requestId.</AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
