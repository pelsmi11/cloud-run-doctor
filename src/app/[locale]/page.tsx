import { DoctorHero, EvidencePreview, SiteHeader } from "@/components";

const Home = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
        <DoctorHero />
        <EvidencePreview />
      </main>
    </div>
  );
};

export default Home;
