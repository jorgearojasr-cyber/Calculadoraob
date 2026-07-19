import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ModuleForm } from "@/components/admin/module-form";
import { createModuleAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewModulePage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <Link
        href="/admin/modulos"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Módulos
      </Link>
      <h1 className="font-display text-2xl font-semibold tracking-tight mb-6">Nuevo módulo</h1>
      <ModuleForm action={createModuleAction} categories={categories} submitLabel="Crear módulo" />
    </div>
  );
}
