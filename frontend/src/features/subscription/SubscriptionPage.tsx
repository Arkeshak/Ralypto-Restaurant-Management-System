import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/common/PageHeader";
import { BigButton } from "@/components/common/BigButton";
import { formatMoney } from "@/lib/formatMoney";
import { Check, Download, FileText, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import type { PlanCode } from "@/api/types";

export function SubscriptionPage() {
  const { plan, setMockPlan } = useAuth();
  const currentCode = plan?.code || "standard";

  const tiers: Array<{
    code: PlanCode;
    name: string;
    priceCents: number;
    description: string;
    features: string[];
    isPopular?: boolean;
  }> = [
    {
      code: "basic",
      name: "Basic Plan",
      priceCents: 1250000,
      description: "Essential POS billing & kitchen display for small cafés",
      features: [
        "POS Billing & Cashier Shifts",
        "Kitchen Display System (KDS)",
        "Digital QR Menu (View-only)",
        "Up to 3 staff accounts",
        "Standard Daily Reports",
      ],
    },
    {
      code: "standard",
      name: "Standard Plan",
      priceCents: 2450000,
      description: "Floor operations, mobile waiter app & food cost control",
      features: [
        "All Basic Features",
        "Waiter Mobile Ordering App",
        "Customer QR Self-Ordering & Waiter Call",
        "Inventory & Recipe Depletion",
        "Delivery Integration (Uber Eats & PickMe)",
        "Up to 10 staff accounts",
        "35+ Deep Analytical Reports",
      ],
      isPopular: true,
    },
    {
      code: "premium",
      name: "Premium Plan",
      priceCents: 4800000,
      description: "Full enterprise hospitality suite with AI and Accounting",
      features: [
        "All Standard Features",
        "Double-Entry Accounting & Payroll",
        "Multi-Branch Operations",
        "Unlimited staff users",
        "Gemini AI Hospitality Advisor",
        "AI Demand & Stock Prediction",
        "24/7 Priority WhatsApp Support",
      ],
    },
  ];

  const invoices = [
    { id: "INV-2026-10", date: "Oct 01, 2026", amountCents: 2450000, status: "Paid" },
    { id: "INV-2026-09", date: "Sep 01, 2026", amountCents: 2450000, status: "Paid" },
    { id: "INV-2026-08", date: "Aug 01, 2026", amountCents: 2450000, status: "Paid" },
  ];

  const handleSelectPlan = (code: PlanCode) => {
    if (code === currentCode) return;
    setMockPlan(code);
    toast.success(`Switched restaurant plan to ${code.toUpperCase()}`);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent("Hi Ralypto sales, I would like to inquire about plan upgrade and payment options.");
    window.open(`https://wa.me/94770000000?text=${text}`, "_blank");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="My Plan & Subscription"
        description="View your active tier, renew date, past invoices, or upgrade to unlock features."
      />

      {/* Current Plan Overview Card */}
      <div className="rounded-card border border-border bg-surface p-6 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Current Subscription
          </span>
          <div className="mt-1 flex items-baseline gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-text">
              {plan?.name || "Standard Plan"}
            </h2>
            <span className="rounded-full bg-success-soft px-3 py-0.5 text-xs font-bold text-success">
              Active
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            Next renewal on <b>November 15, 2026</b> · {formatMoney(plan?.monthlyPriceCents || 2450000)} / month
          </p>
        </div>

        <BigButton
          label="Contact Sales on WhatsApp"
          icon={MessageCircle}
          variant="secondary"
          size="md"
          onClick={handleWhatsApp}
        />
      </div>

      {/* Plan Comparison Cards */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold tracking-[-0.02em] text-text">Available Subscription Tiers</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {tiers.map((t) => {
            const isCurrent = currentCode === t.code;

            return (
              <div
                key={t.code}
                className={`relative flex flex-col justify-between rounded-card border bg-surface p-6 shadow-card transition-all ${
                  isCurrent
                    ? "border-brand ring-2 ring-brand/10"
                    : "border-border hover:border-brand/40"
                }`}
              >
                {t.isPopular && (
                  <span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-0.5 text-xs font-bold text-surface shadow-sm">
                    Most Popular
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-bold text-text">{t.name}</h4>
                    {isCurrent && (
                      <span className="text-xs font-bold text-brand bg-brand-soft px-2.5 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted min-h-8">{t.description}</p>

                  <div className="mt-4 pb-4 border-b border-border/40">
                    <span className="text-3xl font-extrabold tabular-nums text-text">
                      {formatMoney(t.priceCents)}
                    </span>
                    <span className="text-xs text-muted font-medium"> / month</span>
                  </div>

                  {/* Features list */}
                  <div className="py-4 space-y-2.5">
                    {t.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2.5 text-xs text-text">
                        <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40">
                  <BigButton
                    label={
                      isCurrent
                        ? "Current Plan"
                        : (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === "true")
                          ? `Switch to ${t.name} (Dev Mode)`
                          : `Upgrade to ${t.name}`
                    }
                    variant={isCurrent ? "secondary" : "primary"}
                    full
                    disabled={isCurrent}
                    onClick={() => {
                      if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === "true") {
                        handleSelectPlan(t.code);
                      } else {
                        handleWhatsApp();
                      }
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoices List */}
      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        <h3 className="text-lg font-semibold text-text mb-1">Billing Invoices</h3>
        <p className="text-xs text-muted mb-4">Past monthly tax receipts</p>

        <div className="divide-y divide-border/60">
          {invoices.map((inv) => (
            <div key={inv.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted" />
                <div>
                  <h4 className="text-sm font-semibold text-text">{inv.id}</h4>
                  <span className="text-xs text-muted">{inv.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm font-bold tabular-nums text-text">
                  {formatMoney(inv.amountCents)}
                </span>
                <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">
                  {inv.status}
                </span>
                <button
                  onClick={() => toast.success(`Downloading PDF for invoice ${inv.id}`)}
                  title="Download receipt"
                  className="p-1.5 rounded-full hover:bg-bg text-muted hover:text-text"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default SubscriptionPage;
