import { useCallback, useEffect, useState } from "react";
import { Bike, Plus, Globe, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { apiClient } from "@/api/client";
import { toast } from "sonner";

export function DeliveryPage() {
  type Delivery = { id: string; customer: string; phone: string; address: string; amount: number; status: string; provider: string };
  const [rows, setRows] = useState<Delivery[]>([]); const [form, setForm] = useState({ customer: "", phone: "", address: "", amount: 0, provider: "Direct" });
  const load = useCallback(async () => setRows(await apiClient<Delivery[]>("/showcase/delivery")), []);
  useEffect(() => { void load().catch(() => toast.error("Could not load deliveries")); }, [load]);
  const add = async (event: React.FormEvent) => { event.preventDefault(); try { await apiClient("/showcase/delivery", { method: "POST", body: JSON.stringify({ ...form, status: "received" }) }); setForm({ customer: "", phone: "", address: "", amount: 0, provider: "Direct" }); await load(); toast.success("Delivery recorded"); } catch { toast.error("Could not save delivery"); } };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Delivery Orders"
        description="Record direct and aggregator orders, then track their dispatch status."
        action={{ label: "New Delivery", icon: Plus, onClick: () => document.getElementById("delivery-customer")?.focus() }}
      />

      <div className="rounded-card border border-border bg-surface p-8 shadow-card">
        <div className="flex items-center gap-3 pb-4 border-b border-border/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Bike className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text">Delivery Integrations Module</h3>
            <p className="text-sm text-muted">{rows.length} persisted deliveries · external marketplace sync is not connected</p>
          </div>
        </div>

        <form onSubmit={add} className="grid md:grid-cols-2 gap-3 mt-5">
          <input id="delivery-customer" required placeholder="Customer name" value={form.customer} onChange={e => setForm({...form, customer:e.target.value})} className="rounded-xl border border-border bg-bg p-3 text-sm" />
          <input required placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} className="rounded-xl border border-border bg-bg p-3 text-sm" />
          <input required placeholder="Delivery address" value={form.address} onChange={e => setForm({...form, address:e.target.value})} className="rounded-xl border border-border bg-bg p-3 text-sm" />
          <div className="flex gap-2"><input type="number" min="0" required placeholder="Amount (cents)" value={form.amount} onChange={e => setForm({...form, amount:Number(e.target.value)})} className="min-w-0 flex-1 rounded-xl border border-border bg-bg p-3 text-sm"/><select value={form.provider} onChange={e=>setForm({...form,provider:e.target.value})} className="rounded-xl border border-border bg-bg p-3 text-sm"><option>Direct</option><option>PickMe</option><option>Uber Eats</option></select><button className="rounded-xl bg-brand px-4 text-surface"><Plus size={18}/></button></div>
        </form>
        <div className="mt-5 divide-y divide-border border border-border rounded-xl">
          {!rows.length && <p className="p-6 text-center text-muted">No delivery orders recorded.</p>}
          {rows.map(row=><div key={row.id} className="p-4 grid sm:grid-cols-[1fr_auto_auto] gap-3 items-center"><div><p className="font-semibold">{row.customer} · {row.phone}</p><p className="text-xs text-muted">{row.address} · {row.provider}</p></div><select aria-label={`Status for ${row.customer}`} value={row.status} onChange={async e=>{await apiClient(`/showcase/delivery/${row.id}`,{method:"PATCH",body:JSON.stringify({status:e.target.value})}); await load();}} className="rounded-lg border border-border bg-bg p-2 text-sm">{["received","preparing","out_for_delivery","delivered","cancelled"].map(s=><option key={s} value={s}>{s.replace(/_/g," ")}</option>)}</select><button aria-label="Delete delivery" onClick={async()=>{await apiClient(`/showcase/delivery/${row.id}`,{method:"DELETE"});await load();}}><Trash2 size={16}/></button></div>)}
        </div>
        <p className="mt-4 text-xs text-muted flex gap-2"><Globe size={14}/> Marketplace webhooks and rider dispatch require external provider credentials.</p>
      </div>
    </div>
  );
}
export default DeliveryPage;
