import { Package, Plus, ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { BigButton } from "@/components/common/BigButton";
import { toast } from "sonner";

export function InventoryPage() {
  const todoList = [
    { title: "Goods Received Notes (GRN)", desc: "Record supplier purchase orders, quantities, unit prices, and batch expiry." },
    { title: "Recipe Bill of Materials (BOM)", desc: "Map dishes to raw ingredients: 1 Kottu -> 180g godamba roti, 120g chicken, 1 egg." },
    { title: "Automated Recipe Depletion", desc: "Real-time raw stock deduction upon order completion at POS." },
    { title: "Low Stock & Spoilage Audits", desc: "Automated alert triggers when stock dips below safety threshold." },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Stock & Inventory"
        description="Raw materials, supplier purchases, and automatic recipe depletion."
        action={{
          label: "New GRN Entry",
          icon: Plus,
          onClick: () => toast.info("GRN entry module is scheduled for Phase 2."),
        }}
      />

      <div className="rounded-card border border-border bg-surface p-8 shadow-card">
        <div className="flex items-center gap-3 pb-4 border-b border-border/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text">Inventory Management Module</h3>
            <p className="text-sm text-muted">Planned for Standard & Premium plan tiers</p>
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
            label="View Stock Audit Logs"
            icon={ClipboardList}
            variant="secondary"
            onClick={() => toast.info("Audit logs will appear after first inventory sync.")}
          />
        </div>
      </div>
    </div>
  );
}
export default InventoryPage;
