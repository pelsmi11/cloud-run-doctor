import { DoctorHero } from "@/components/doctor-hero";
import { EvidencePreview } from "@/components/evidence-preview";
import { SiteHeader } from "@/components/site-header";

/**
 * Home page placeholder for Cloud Run Doctor.
 * Technical, calm and diagnostic — no agent logic yet.
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
        <DoctorHero />
        <EvidencePreview />
      </main>
    </div>
  );
}
