import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { isProtectedPath } from "@/lib/protected-routes";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const requiresSession = isProtectedPath(pathname);

  if (!requiresSession) return NextResponse.next();

  if (!token || (isAdminRoute && token.role !== "admin")) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Mejora UX/Auth flow (2026-09-16) — se agregan /inspecciones y
// /regularizacion al matcher: antes solo estaban protegidas por un
// `getServerSession` + `redirect` manual dentro de cada page.tsx (ver
// src/lib/protected-routes.ts). Ese guard manual queda intacto como
// defensa en profundidad, pero ahora middleware.ts también las cubre,
// igual que /proyectos, así el flujo de login→retorno es consistente en
// las 6 tarjetas del Home sin depender de que cada página nueva recuerde
// agregar su propio check.
//
// El array de `matcher` debe listarse literal (Next.js lo evalúa en build
// time) — se mantiene en sync manualmente con PROTECTED_PATH_PREFIXES.
export const config = {
  matcher: [
    "/admin/:path*",
    "/proyectos/:path*",
    "/lista-compras/:path*",
    "/galeria/nueva/:path*",
    "/inspecciones/:path*",
    "/regularizacion/:path*",
  ],
};
