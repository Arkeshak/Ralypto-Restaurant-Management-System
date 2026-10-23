import React from "react";
import { useFeature } from "../../hooks/useFeature";
import { UpgradeCard } from "../../components/common/UpgradeCard";
import type { FeatureFlags } from "../../api/types";

interface RequirePlanFeatureProps {
  feature: keyof FeatureFlags;
  featureTitle?: string;
  featureDescription?: string;
  minPlanName?: string;
  children: React.ReactElement;
}

export const RequirePlanFeature: React.FC<RequirePlanFeatureProps> = ({
  feature,
  featureTitle = "Premium Feature",
  featureDescription,
  minPlanName = "Standard or Premium Plan",
  children,
}) => {
  const isEnabled = useFeature(feature);

  if (isEnabled) {
    return children;
  }

  return (
    <div className="flex min-h-[460px] items-center justify-center p-6">
      <UpgradeCard
        featureTitle={featureTitle}
        minPlanName={minPlanName}
        description={featureDescription}
      />
    </div>
  );
};
