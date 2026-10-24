import { useEffect, useState } from "react";
import { Wallet, Plus, FileSpreadsheet, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { apiClient } from "@/api/client";
import { toast } from "sonner";

export function AccountingPage() {
  type Expense = { id: string; description: string; category: string; amountCents: number; date: string; note?: string };
  const [rows, setRows] = useState<Expense[]>([]); const [form,setForm] = useState({description:"",category:"Supplies",amountCents:0,date:new Date().toISOString().slice(0,10)});
  const load=async()=>setRows(await apiClient<Expense[]>("/showcase/accounting"));
  useEffect(()=>{void load().catch(()=>toast.error("Could not load expenses"));},[]);
  const add=async(event:React.FormEvent)=>{event.preventDefault();try{await apiClient("/showcase/accounting",{method:"POST",body:JSON.stringify(form)});setForm({...form,description:"",amountCents:0});await load();toast.success("Expense recorded");}catch{toast.error("Could not save expense");}};
  const total=rows.reduce((sum,row)=>sum+Number(row.amountCents||0),0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Accounts & Ledger"
        description="Persist operating expenses and review recorded outflows."
        action={{ label: "Record Expense", icon: Plus, onClick: () => document.getElementById("expense-description")?.focus() }}
      />

      <div className="rounded-card border border-border bg-surface p-8 shadow-card">
        <div className="flex items-center gap-3 pb-4 border-b border-border/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text">Accounting & Finance Module</h3>
            <p className="text-sm text-muted">Expense register · {rows.length} records</p>
          </div>
        </div>

        <div className="mt-5 grid sm:grid-cols-2 gap-3"><div className="rounded-xl border border-border p-4"><p className="text-xs text-muted">Recorded expenses</p><p className="text-xl font-bold">{rows.length}</p></div><div className="rounded-xl border border-border p-4"><p className="text-xs text-muted">Total outflow (cents)</p><p className="text-xl font-bold">{total.toLocaleString()}</p></div></div>
        <form onSubmit={add} className="mt-5 grid md:grid-cols-4 gap-2"><input id="expense-description" required placeholder="Expense description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="rounded-xl border border-border bg-bg p-3 text-sm"/><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="rounded-xl border border-border bg-bg p-3 text-sm">{["Supplies","Utilities","Rent","Payroll","Repairs","Other"].map(x=><option key={x}>{x}</option>)}</select><input type="number" min="1" required placeholder="Amount (cents)" value={form.amountCents||""} onChange={e=>setForm({...form,amountCents:Number(e.target.value)})} className="rounded-xl border border-border bg-bg p-3 text-sm"/><button className="rounded-xl bg-brand text-surface font-bold flex items-center justify-center gap-2"><Plus size={16}/> Record</button></form>
        <div className="mt-5 divide-y divide-border border border-border rounded-xl">{!rows.length&&<p className="p-6 text-center text-muted">No expenses recorded.</p>}{rows.map(row=><div key={row.id} className="p-4 flex justify-between items-center gap-3"><div><p className="font-semibold">{row.description} · {row.category}</p><p className="text-xs text-muted">{row.date}</p></div><div className="flex items-center gap-3"><b>{Number(row.amountCents).toLocaleString()} cents</b><button aria-label="Delete expense" onClick={async()=>{await apiClient(`/showcase/accounting/${row.id}`,{method:"DELETE"});await load();}}><Trash2 size={16}/></button></div></div>)}</div>
        <p className="mt-4 text-xs text-muted flex gap-2"><FileSpreadsheet size={14}/> This is an expense register, not a double-entry ledger, bank reconciliation, or tax filing system.</p>
      </div>
    </div>
  );
}
export default AccountingPage;
