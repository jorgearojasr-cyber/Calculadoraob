import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShowcaseForm } from "@/components/galeria/showcase-form";

export default async function GaleriaNuevaPage() {
  // El middleware ya exige sesión para /galeria/nueva; esto solo cubre el
  // caso borde de sesión recién expirada entre la redirección y el render.
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const projects = await prisma.savedProject.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-xl mx-auto px-6 pt-8 pb-20">
      <h1 className="font-display text-[22px] font-semibold tracking-tight mb-2">Publica tu proyecto</h1>
      <p className="text-sm text-ink-muted mb-6">
        Comparte tu obra terminada con fotos de antes y después. Se revisa antes de mostrarse
        públicamente en la galería.
      </p>

      <ShowcaseForm savedProjects={projects} />
    </div>
  );
}
