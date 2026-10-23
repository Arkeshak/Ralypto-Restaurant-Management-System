import { useSearchParams } from "react-router-dom";
import { UpgradeCard } from "@/components/common/UpgradeCard";

const featureLabels: Record<string, { title: string; plan: string }> = {
  inventory_management: { title: "Inventory & Recipe Costing", plan: "Standard Plan" },
  delivery_integration: { title: "Delivery Aggregators (Uber Eats / PickMe)", plan: "Standard Plan" },
  waiter_app: { title: "Waiter Mobile Ordering App", plan: "Standard Plan" },
  accounting_ledger: { title: "Double-Entry Accounting & Payroll", plan: "Premium Plan" },
  ai_assistant: { title: "Gemini AI Hospitality Advisor", plan: "Premium Plan" },
};

export function UpgradePage() {
  const [params] = useSearchParams();
  const featureKey = params.get("feature") || "ai_assistant";
  const info = featureLabels[featureKey] || {
    title: "Advanced Management Tools",
    plan: "Standard Plan",
  };

  return (
    <div className="flex min-h-[500px] items-center justify-center p-6">
      <UpgradeCard
        featureTitle={info.title}
        minPlanName={info.plan}
      />
    </div>
  );
}
export default UpgradePage;
