import { DoctorHero, SiteHeader } from "@/components";
import { ChatView } from "@/components/chat/ChatView";

const Home = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
        <DoctorHero />
        <ChatView />
      </main>
    </div>
  );
};

export default Home;
