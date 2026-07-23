import { prisma } from "@/lib/prisma";
import { Hero } from "@/components/home/hero";
import { CategoryOverviewGrid } from "@/components/home/category-overview-grid";
import { PopularProjects } from "@/components/home/popular-projects";
import { ProjectGroupsSection } from "@/components/home/project-groups-section";
import { CategorySection } from "@/components/home/category-section";
import { RecentProjects } from "@/components/home/recent-projects";
import { HowItWorks } from "@/components/home/how-it-works";
import { LearnBanner } from "@/components/home/learn-banner";
import { TrustSection } from "@/components/home/trust-section";
import { SiteFooter } from "@/components/home/site-footer";

export default async function Home() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <div>
      <Hero />
      <CategoryOverviewGrid />
      <PopularProjects />
      <ProjectGroupsSection />
      <RecentProjects />
      <CategorySection categories={categories} />
      <HowItWorks />
      <LearnBanner />
      <TrustSection />
      <SiteFooter />
    </div>
  );
}
