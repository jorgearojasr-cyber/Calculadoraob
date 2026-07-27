import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PlanForm } from "@/components/admin/plan-form";
import { createProjectPlanAction } from "../actions";

export default function NewPlanPage() {
  return (
    <div>
      <Link
        href="/admin/planes"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Planes de fases
      </Link>
      <h1 className="font-display text-2xl font-semibold tracking-tight mb-6">Nuevo plan</h1>
      <PlanForm action={createProjectPlanAction} submitLabel="Crear plan" />
    </div>
  );
}
