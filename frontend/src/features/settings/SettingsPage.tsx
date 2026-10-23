import { Settings, Printer, Save } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { BigButton } from "@/components/common/BigButton";
import { toast } from "sonner";

export function SettingsPage() {
  const todoList = [
    { title: "ESC/POS Thermal Receipt Printers", desc: "Configure 80mm and 58mm network LAN and USB thermal printers." },
    { title: "Taxes & Service Charge Rates", desc: "Manage Sri Lankan 10% standard service charge and VAT/SSCL calculations." },
    { title: "Kitchen Display Routing Rules", desc: "Route items automatically to Bar or Kitchen stations by category." },
    { title: "Backup & Cloud Sync Frequencies", desc: "Configure local IndexedDB offline storage and sync thresholds." },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Settings"
        description="Restaurant profile, hardware peripherals, taxes, and system preferences."
        action={{
          label: "Save Changes",
          icon: Save,
          onClick: () => toast.success("Settings saved successfully"),
        }}
      />

      <div className="rounded-card border border-border bg-surface p-8 shadow-card">
        <div className="flex items-center gap-3 pb-4 border-b border-border/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text">System Configuration</h3>
            <p className="text-sm text-muted">Owner and Manager administration</p>
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

        <div className="mt-8 pt-6 border-t border-border/40 flex justify-end gap-3">
          <BigButton
            label="Configure Printers"
            icon={Printer}
            variant="secondary"
            onClick={() => toast.info("Printer configuration will scan local network.")}
          />
        </div>
      </div>
    </div>
  );
}
export default SettingsPage;
