import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Store,
  LayoutGrid,
  UtensilsCrossed,
  Users,
  Printer,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { BigButton } from "@/components/common/BigButton";
import { toast } from "sonner";

export function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [demoMode, setDemoMode] = useState(true);

  // Form states
  const [restName, setRestName] = useState("Ceylon Spice Bistro");
  const [phone, setPhone] = useState("+94 11 234 5678");
  const [tableCount, setTableCount] = useState("12");
  const [categoriesText, setCategoriesText] = useState("Rice & Kottu, Starters, Beverages, Desserts");
  const [staffEmail, setStaffEmail] = useState("cashier@bistro.lk");

  const steps = [
    { number: 1, title: "Restaurant Info", icon: Store, desc: "Name, contact and brand logo" },
    { number: 2, title: "Floor Tables", icon: LayoutGrid, desc: "Table layout and seating" },
    { number: 3, title: "Menu Categories", icon: UtensilsCrossed, desc: "Main dining sections" },
    { number: 4, title: "Add Staff", icon: Users, desc: "Cashier and waiter accounts" },
    { number: 5, title: "Test Receipt", icon: Printer, desc: "Print a sample test bill" },
  ];

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      toast.success("Setup complete! Welcome to Ralypto.");
      navigate("/tables");
    }
  };

  const handleSkip = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/tables");
    }
  };

  const handlePrintTestReceipt = () => {
    toast.success("Sending test receipt to connected thermal printer...");
    window.print();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Welcome to Ralypto"
        description="Follow our quick 5-step setup wizard to configure your restaurant."
      >
        {/* Demo Mode Switch */}
        <button
          onClick={() => {
            const next = !demoMode;
            setDemoMode(next);
            toast.info(next ? "Demo mode activated with sample data" : "Live production mode active");
          }}
          className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold hover:bg-bg transition-colors"
        >
          {demoMode ? (
            <ToggleRight className="h-5 w-5 text-success" />
          ) : (
            <ToggleLeft className="h-5 w-5 text-muted" />
          )}
          <span>Demo Practice Mode</span>
        </button>
      </PageHeader>

      {/* Progress Bar & Step Indicators */}
      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        {/* Progress Bar Line */}
        <div className="relative mb-6">
          <div className="h-1.5 w-full rounded-full bg-border/40" />
          <motion.div
            className="absolute top-0 left-0 h-1.5 rounded-full bg-brand"
            initial={{ width: "20%" }}
            animate={{ width: `${(currentStep / 5) * 100}%` }}
            transition={{ duration: 0.25 }}
          />
        </div>

        {/* Step Icons */}
        <div className="grid grid-cols-5 gap-2">
          {steps.map((s) => {
            const Icon = s.icon;
            const isCompleted = currentStep > s.number;
            const isCurrent = currentStep === s.number;

            return (
              <button
                key={s.number}
                onClick={() => setCurrentStep(s.number)}
                className={`flex flex-col items-center text-center transition-colors ${
                  isCurrent
                    ? "text-brand"
                    : isCompleted
                    ? "text-success"
                    : "text-muted hover:text-text"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full mb-1.5 border transition-all ${
                    isCurrent
                      ? "border-brand bg-brand text-surface shadow-sm"
                      : isCompleted
                      ? "border-success bg-success-soft text-success"
                      : "border-border bg-bg text-muted"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className="text-xs font-bold truncate max-w-full">{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Step Content Form */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="rounded-card border border-border bg-surface p-6 sm:p-8 shadow-card space-y-6"
      >
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Step {currentStep} of 5
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-text mt-0.5">
            {steps[currentStep - 1].title}
          </h2>
          <p className="text-sm text-muted">{steps[currentStep - 1].desc}</p>
        </div>

        {/* Step 1: Restaurant Info */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                Restaurant Trade Name
              </label>
              <input
                type="text"
                value={restName}
                onChange={(e) => setRestName(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-border bg-bg text-text text-sm focus:outline-none focus:ring-2 focus:ring-info"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                Direct Contact Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-border bg-bg text-text text-sm focus:outline-none focus:ring-2 focus:ring-info"
              />
            </div>
          </div>
        )}

        {/* Step 2: Tables */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                Total Number of Tables
              </label>
              <input
                type="number"
                value={tableCount}
                onChange={(e) => setTableCount(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-border bg-bg text-text text-sm focus:outline-none focus:ring-2 focus:ring-info"
              />
            </div>
            <p className="text-xs text-muted">
              We will automatically generate dining tables T1 through T{tableCount || 12} with 4 seats each. You can group them into areas (Inside, Outside, Rooftop) anytime later.
            </p>
          </div>
        )}

        {/* Step 3: Categories */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                Dining Menu Categories (comma separated)
              </label>
              <textarea
                rows={3}
                value={categoriesText}
                onChange={(e) => setCategoriesText(e.target.value)}
                className="w-full p-4 rounded-xl border border-border bg-bg text-text text-sm focus:outline-none focus:ring-2 focus:ring-info"
              />
            </div>
          </div>
        )}

        {/* Step 4: Add Staff */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                Invite Cashier or Floor Waiter (Email)
              </label>
              <input
                type="email"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-border bg-bg text-text text-sm focus:outline-none focus:ring-2 focus:ring-info"
              />
            </div>
            <p className="text-xs text-muted">
              Staff members will receive an invite to sign in with their unique 4-digit PIN pad.
            </p>
          </div>
        )}

        {/* Step 5: Test Receipt */}
        {currentStep === 5 && (
          <div className="space-y-4 text-center py-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand mb-2">
              <Printer className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-text">Verify Hardware Connection</h3>
            <p className="text-sm text-muted max-w-sm mx-auto">
              Test your 80mm thermal receipt printer to ensure bills and kitchen tickets format clearly.
            </p>
            <div className="pt-2">
              <BigButton
                label="Print Sample Test Bill"
                icon={Printer}
                variant="secondary"
                onClick={handlePrintTestReceipt}
              />
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-border/40">
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm font-semibold text-muted hover:text-text"
          >
            Skip for now
          </button>

          <BigButton
            label={currentStep === 5 ? "Finish Setup" : "Save & Continue"}
            icon={ArrowRight}
            variant="primary"
            onClick={handleNext}
          />
        </div>
      </motion.div>

      {/* First-time Walkthrough Tips */}
      <div className="rounded-card border border-border bg-surface p-6 shadow-card space-y-4">
        <h3 className="font-semibold text-base text-text flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand" />
          <span>Quick Staff Tips (Master in 5 Seconds)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-muted">
          <div className="p-3 rounded-xl border border-border bg-bg">
            <b className="text-text block mb-1">1. Fast Search</b>
            Press <code className="rounded bg-surface px-1.5 py-0.5 border text-text">/</code> anywhere on the POS screen to immediately search dishes.
          </div>
          <div className="p-3 rounded-xl border border-border bg-bg">
            <b className="text-text block mb-1">2. Offline Reliability</b>
            If internet drops, orders are automatically saved locally and queued in IndexedDB.
          </div>
          <div className="p-3 rounded-xl border border-border bg-bg">
            <b className="text-text block mb-1">3. Instant Sold Out</b>
            Tap the status button on any dish in the Menu Manager to mark it sold out in real-time.
          </div>
          <div className="p-3 rounded-xl border border-border bg-bg">
            <b className="text-text block mb-1">4. Kitchen Timers</b>
            Kitchen tickets turn orange at 10 minutes and red at 20 minutes to prioritize delayed orders.
          </div>
        </div>
      </div>
    </div>
  );
}
export default OnboardingPage;
