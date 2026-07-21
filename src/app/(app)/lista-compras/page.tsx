import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getShoppingListData } from "@/lib/shopping-list";
import { ShoppingListView } from "@/components/shopping-list/shopping-list-view";

export default async function ListaComprasPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const data = await getShoppingListData(session.user.id);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mb-2">
        Lista de compras
      </h1>
      <p className="text-sm text-ink-muted mb-8">
        Materiales consolidados de los proyectos que marcaste para incluir en la lista.
      </p>

      <ShoppingListView data={data} />
    </div>
  );
}
