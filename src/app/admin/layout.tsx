import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen w-full bg-concrete text-ink font-body">
      <header className="max-w-6xl mx-auto px-6 pt-6 flex items-center gap-8">
        <Link href="/admin" className="font-display text-lg font-semibold tracking-tight">
          ObraBien Admin
        </Link>
        <nav className="flex items-center gap-6 text-sm text-ink-muted">
          <Link href="/admin" className="hover:text-ink transition-colors">
            Dashboard
          </Link>
          <Link href="/admin/categorias" className="hover:text-ink transition-colors">
            Categorías
          </Link>
          <Link href="/admin/modulos" className="hover:text-ink transition-colors">
            Módulos
          </Link>
        </nav>
        <Link href="/" className="ml-auto text-sm text-ink-muted hover:text-ink transition-colors">
          Ver sitio →
        </Link>
        <div className="flex items-center gap-3 text-sm text-ink-muted">
          {session?.user?.email}
          <SignOutButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
