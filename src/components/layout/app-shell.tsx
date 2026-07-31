import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TopNav } from "./top-nav";
import { MobileTopBar } from "./mobile-top-bar";
import { BottomNav } from "./bottom-nav";
import { MainContent } from "./main-content";
import { AssistantWidget } from "@/components/assistant/assistant-widget";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const user = session?.user
    ? { name: session.user.name ?? null, email: session.user.email ?? null, image: session.user.image ?? null }
    : null;
  const isAdmin = session?.user?.role === "admin";

  // Datos para el asistente "Preguntar ahora" (árbol de reglas fijas, sin
  // IA) — mismos ProjectGroup/ProjectTask reales que ya alimentan la Home.
  const assistantGroups = await prisma.projectGroup.findMany({
    where: { tasks: { some: {} } },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      icon: true,
      tasks: { orderBy: { order: "asc" }, select: { id: true, slug: true, name: true } },
    },
  });

  return (
    <div className="min-h-screen w-full bg-concrete text-ink font-body">
      <TopNav isAdmin={isAdmin} user={user} />
      <MobileTopBar user={user} />
      <BottomNav user={user} assistantGroups={assistantGroups} />
      {/* Sin sidebar que anclar, el widget de ayuda flota fijo en desktop —
          mismo componente que el FAB mobile, solo reposicionado. */}
      <div className="hidden md:block fixed bottom-6 right-6 z-30">
        <AssistantWidget groups={assistantGroups} variant="fab-desktop" />
      </div>
      <MainContent>{children}</MainContent>
    </div>
  );
}
