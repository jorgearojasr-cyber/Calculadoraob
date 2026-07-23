import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";

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
      <Sidebar isAdmin={isAdmin} user={user} assistantGroups={assistantGroups} />
      <BottomNav user={user} assistantGroups={assistantGroups} />
      <main className="md:pl-60 pb-20 md:pb-0">{children}</main>
    </div>
  );
}
