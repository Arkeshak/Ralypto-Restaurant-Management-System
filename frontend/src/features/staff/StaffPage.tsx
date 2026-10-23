import { Users, Plus, KeyRound } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { BigButton } from "@/components/common/BigButton";
import { toast } from "sonner";

export function StaffPage() {
  const todoList = [
    { title: "Staff PIN Pad Assignment", desc: "Issue and reset secure 4-digit numeric floor access PINs for waiters and cashiers." },
    { title: "Role-Based Access Control", desc: "Enforce strict roles: Owner, Manager, Cashier, Waiter, Kitchen Chef, and Accountant." },
    { title: "Shift Attendance & Clock-In", desc: "Track opening float, closing cash reconciliation, and staff hourly timesheets." },
    { title: "Performance & Tips Distribution", desc: "Track sales volume per server and automate pooled gratuity distribution." },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Staff Directory"
        description="Employee accounts, floor PIN assignments, and role permissions."
        action={{
          label: "Add Staff Member",
          icon: Plus,
          onClick: () => toast.info("Staff management form scheduled for Phase 2."),
        }}
      />

      <div className="rounded-card border border-border bg-surface p-8 shadow-card">
        <div className="flex items-center gap-3 pb-4 border-b border-border/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text">Team & Floor Roles</h3>
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

        <div className="mt-8 pt-6 border-t border-border/40 flex justify-end">
          <BigButton
            label="Staff PIN Directory"
            icon={KeyRound}
            variant="secondary"
            onClick={() => toast.info("PIN directory will open once staff sync is active.")}
          />
        </div>
      </div>
    </div>
  );
}
export default StaffPage;
