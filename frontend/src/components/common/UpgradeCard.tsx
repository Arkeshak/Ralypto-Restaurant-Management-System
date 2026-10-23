import { Lock, MessageCircle } from "lucide-react";
import { BigButton } from "./BigButton";

interface UpgradeCardProps {
  featureTitle: string;
  minPlanName?: string;
  description?: string;
}

export function UpgradeCard({
  featureTitle,
  minPlanName = "Standard Plan",
  description = "This feature is available on the next plan. Upgrade your subscription to unlock powerful features for your restaurant.",
}: UpgradeCardProps) {
  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Hi Ralypto team, I would like to upgrade my restaurant to the ${minPlanName} to access ${featureTitle}.`);
    window.open(`https://wa.me/94770000000?text=${text}`, "_blank");
  };

  return (
    <div className="mx-auto max-w-xl rounded-card border border-border bg-surface p-8 text-center shadow-card">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Lock className="h-7 w-7" aria-hidden />
      </div>

      <h2 className="mt-5 text-2xl font-semibold tracking-[-0.02em] text-text">
        {featureTitle} is locked
      </h2>

      <p className="mt-2 text-base text-muted">
        {description}
      </p>

      <div className="mt-3 inline-block rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand">
        Available on {minPlanName}
      </div>

      <div className="mt-8 flex justify-center">
        <BigButton
          label="Contact us on WhatsApp"
          icon={MessageCircle}
          onClick={handleWhatsApp}
          variant="primary"
          size="lg"
        />
      </div>
    </div>
  );
}
