import { useCallback, useEffect, useState } from "react";
import { Package, Plus, ClipboardList, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { apiClient } from "@/api/client";
import { toast } from "sonner";

export function InventoryPage() {
  type Stock = { id: string; name: string; quantity: number; unit: string; reorderLevel: number; supplier?: string };
  const [items, setItems] = useState<Stock[]>([]);
  const [name, setName] = useState(""); const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState("kg"); const [reorderLevel, setReorderLevel] = useState(1);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => setItems(await apiClient<Stock[]>("/showcase/inventory")), []);
  useEffect(() => { void load().catch(() => toast.error("Could not load inventory")); }, [load]);
  const add = async (event: React.FormEvent) => {
    event.preventDefault(); if (!name.trim()) return;
    setBusy(true);
    try { await apiClient("/showcase/inventory", { method: "POST", body: JSON.stringify({ name: name.trim(), quantity, unit, reorderLevel }) }); setName(""); setQuantity(0); await load(); toast.success("Stock item saved"); }
    catch { toast.error("Could not save stock item"); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Stock & Inventory"
        description="Track ingredient quantities and flag stock that needs replenishing."
      />

      <div className="rounded-card border border-border bg-surface p-8 shadow-card">
        <div className="flex items-center gap-3 pb-4 border-b border-border/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text">Inventory Management Module</h3>
            <p className="text-sm text-muted">Persisted stock register · {items.filter((item) => item.quantity <= item.reorderLevel).length} low-stock items</p>
          </div>
        </div>

        <form onSubmit={add} className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-5">
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ingredient" className="rounded-xl border border-border bg-bg p-3 text-sm" />
          <input type="number" min="0" step="any" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} aria-label="Quantity" className="rounded-xl border border-border bg-bg p-3 text-sm" />
          <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit" className="rounded-xl border border-border bg-bg p-3 text-sm" />
          <input type="number" min="0" step="any" value={reorderLevel} onChange={(e) => setReorderLevel(Number(e.target.value))} aria-label="Low stock threshold" className="rounded-xl border border-border bg-bg p-3 text-sm" />
          <button disabled={busy} className="rounded-xl bg-brand text-surface font-bold text-sm flex items-center justify-center gap-2"><Plus size={16}/> Add item</button>
        </form>
        <div className="mt-5 divide-y divide-border border border-border rounded-xl">
          {!items.length && <p className="p-6 text-center text-muted">No stock items yet. Add an ingredient to start the register.</p>}
          {items.map((item) => <div key={item.id} className="p-4 flex items-center justify-between gap-3">
            <div><p className="font-semibold">{item.name}</p><p className="text-xs text-muted">Reorder below {item.reorderLevel} {item.unit}</p></div>
            <div className="flex items-center gap-3"><span className={item.quantity <= item.reorderLevel ? "text-rose-600 font-bold" : "font-bold"}>{item.quantity} {item.unit}</span>
              <button aria-label={`Delete ${item.name}`} onClick={async () => { await apiClient(`/showcase/inventory/${item.id}`, { method: "DELETE" }); await load(); }} className="text-muted hover:text-rose-600"><Trash2 size={16}/></button></div>
          </div>)}
        </div>
        <p className="mt-4 text-xs text-muted flex items-center gap-2"><ClipboardList size={14}/> This showcase stock register records manual quantities; recipe depletion and supplier integrations are not configured.</p>
      </div>
    </div>
  );
}
export default InventoryPage;
