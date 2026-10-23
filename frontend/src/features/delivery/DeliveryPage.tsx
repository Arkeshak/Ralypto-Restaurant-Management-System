import { Bike, Plus, Globe } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { BigButton } from "@/components/common/BigButton";
import { toast } from "sonner";

export function DeliveryPage() {
  const todoList = [
    { title: "Uber Eats Webhook Integration", desc: "Automatic order injection into POS billing and kitchen display." },
    { title: "PickMe Food Dispatch Link", desc: "Live rider dispatch updates and driver assignment tracking." },
    { title: "In-House Rider App", desc: "Direct delivery order assigner with customer GPS navigation." },
    { title: "Consolidated Delivery Payouts", desc: "Aggregated reporting on third-party platform commissions vs direct sales." },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Delivery Orders"
        description="Uber Eats, PickMe Food, and in-house delivery dispatch."
        action={{
          label: "New Delivery",
          icon: Plus,
          onClick: () => toast.info("Delivery integrations module scheduled for Phase 2."),
        }}
      />

      <div className="rounded-card border border-border bg-surface p-8 shadow-card">
        <div className="flex items-center gap-3 pb-4 border-b border-border/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Bike className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text">Delivery Integrations Module</h3>
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
            label="Connect Aggregator APIs"
            icon={Globe}
            variant="secondary"
            onClick={() => toast.info("API keys configuration will open when live.")}
          />
        </div>
      </div>
    </div>
  );
}
export default DeliveryPage;
