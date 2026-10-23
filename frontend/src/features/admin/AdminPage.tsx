import { ShieldCheck, Activity, Plus } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { BigButton } from "@/components/common/BigButton";
import { toast } from "sonner";

export function AdminPage() {
  const todoList = [
    { title: "Tenant Provisioning Engine", desc: "Automate new restaurant account creation, slug generation, and database schema isolation." },
    { title: "SaaS Subscription Lifecycle", desc: "Manage billing grace periods, automated suspension, and payment reconciliation." },
    { title: "Platform Telemetry & Health", desc: "Track average latency, IndexedDB sync queues, and WebSocket connections." },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Super Admin SaaS Control"
        description="Platform oversight, multi-tenant restaurant provisioning, and subscriptions."
        action={{
          label: "Provision Tenant",
          icon: Plus,
          onClick: () => toast.info("Tenant provisioning module scheduled for Phase 2."),
        }}
      />

      <div className="rounded-card border border-border bg-surface p-8 shadow-card">
        <div className="flex items-center gap-3 pb-4 border-b border-border/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text">SaaS Platform Management</h3>
            <p className="text-sm text-muted">Super Admin access only</p>
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
            label="View Audit Logs"
            icon={Activity}
            variant="secondary"
            onClick={() => toast.info("Audit logs will appear after system metrics activate.")}
          />
        </div>
      </div>
    </div>
  );
}
export default AdminPage;
