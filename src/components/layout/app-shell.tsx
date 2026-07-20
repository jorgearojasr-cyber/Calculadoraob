import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const user = session?.user
    ? { name: session.user.name ?? null, email: session.user.email ?? null, image: session.user.image ?? null }
    : null;
  const isAdmin = session?.user?.role === "admin";

  return (
    <div className="min-h-screen w-full bg-concrete text-ink font-body">
      <Sidebar isAdmin={isAdmin} user={user} />
      <BottomNav user={user} />
      <main className="md:pl-60 pb-20 md:pb-0">{children}</main>
    </div>
  );
}
