import { Hero } from "@/components/home/hero";
import { ExplorationSection } from "@/components/home/exploration-section";
import { RecentProjects } from "@/components/home/recent-projects";
import { HowItWorks } from "@/components/home/how-it-works";
import { LearnBanner } from "@/components/home/learn-banner";
import { TrustSection } from "@/components/home/trust-section";
import { SiteFooter } from "@/components/home/site-footer";

export default async function Home() {
  return (
    <div>
      <Hero />
      <ExplorationSection />
      <RecentProjects />
      <HowItWorks />
      <LearnBanner />
      <TrustSection />
      <SiteFooter />
    </div>
  );
}
