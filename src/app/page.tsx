import { prisma } from "@/lib/prisma";
import { SiteNav } from "@/components/home/site-nav";
import { Hero } from "@/components/home/hero";
import { CategorySection } from "@/components/home/category-section";
import { HowItWorks } from "@/components/home/how-it-works";
import { TrustSection } from "@/components/home/trust-section";
import { SiteFooter } from "@/components/home/site-footer";

export const revalidate = 3600;

export default async function Home() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <div className="min-h-screen w-full bg-concrete text-ink font-body">
      <SiteNav />
      <Hero />
      <CategorySection categories={categories} />
      <HowItWorks />
      <TrustSection />
      <SiteFooter />
    </div>
  );
}
