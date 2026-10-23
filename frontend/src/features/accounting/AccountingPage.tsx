import { Wallet, Plus, FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { BigButton } from "@/components/common/BigButton";
import { toast } from "sonner";

export function AccountingPage() {
  const todoList = [
    { title: "Double-Entry General Ledger", desc: "Automated journal entries for POS sales, tax liabilities, and expenses." },
    { title: "Profit & Loss (P&L) Statements", desc: "Monthly revenue vs COGS, staff payroll, and operational overheads." },
    { title: "Petty Cash & Expense Vouchers", desc: "Staff cash out approvals with receipts upload and cashier reconciliation." },
    { title: "Bank Reconciliation & Tax Filings", desc: "Exportable RAMIS / Inland Revenue Department Sri Lanka compatible reports." },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Accounts & Ledger"
        description="Double-entry accounting, profit & loss, and petty cash logs."
        action={{
          label: "Record Expense",
          icon: Plus,
          onClick: () => toast.info("Expense ledger scheduled for Phase 2."),
        }}
      />

      <div className="rounded-card border border-border bg-surface p-8 shadow-card">
        <div className="flex items-center gap-3 pb-4 border-b border-border/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text">Accounting & Finance Module</h3>
            <p className="text-sm text-muted">Exclusive to Premium tier accounts</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Planned Features (TODO)
          </h4>
          <div className="space-y-3">
            {todoList.map((item, idx) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-xl border border-border bg-bg/50 p-4"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface border border-border text-xs font-bold text-muted">
                  {idx + 1}
                </span>
                <div>
                  <h5 className="font-semibold text-sm text-text">{item.title}</h5>
                  <p className="text-xs text-muted mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/40 flex justify-end">
          <BigButton
            label="Export Trial Balance"
            icon={FileSpreadsheet}
            variant="secondary"
            onClick={() => toast.info("Trial balance will be generated once ledger is active.")}
          />
        </div>
      </div>
    </div>
  );
}
export default AccountingPage;
