import React from 'react';
import { useFeature } from '../../hooks/useFeature';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { BigButton } from '../../components/common/BigButton';
import { Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FeatureFlags } from '../../api/types';

interface RequirePlanFeatureProps {
  feature: keyof FeatureFlags;
  featureTitle?: string;
  featureDescription?: string;
  minPlanName?: string;
  children: React.ReactElement;
}

export const RequirePlanFeature: React.FC<RequirePlanFeatureProps> = ({
  feature,
  featureTitle,
  featureDescription,
  minPlanName = 'Standard or Premium',
  children,
}) => {
  const isEnabled = useFeature(feature);
  const { plan } = useAuth();
  const { t } = useTranslation();

  if (isEnabled) {
    return children;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[460px] p-8 text-center animate-in fade-in duration-300">
      <div className="relative max-w-lg w-full p-8 rounded-3xl glass-panel border border-brand-800/40 glow-brand">
        <div className="inline-flex p-4 mb-4 rounded-2xl bg-brand-950/80 text-brand-500 border border-brand-800/60">
          <Sparkles className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-950 text-brand-400 border border-brand-800">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Requires {minPlanName}</span>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          {featureTitle || t('common.upgradeToUnlock')}
        </h2>

        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
          {featureDescription ||
            `This module is locked on your current ${
              plan?.name || 'Basic'
            }. Upgrade your monthly subscription to unlock high-speed operational tools, real-time automation, and multi-user access.`}
        </p>

        <div className="p-4 mb-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-left text-xs space-y-2 text-zinc-300">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Current Plan:</span>
            <span className="font-bold text-white uppercase">{plan?.code || 'basic'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Required Tier:</span>
            <span className="font-bold text-brand-400">{minPlanName}</span>
          </div>
        </div>

        <Link to="/subscription" className="block">
          <BigButton variant="brand" size="touch-lg" fullWidth icon={<ArrowRight className="w-5 h-5" />}>
            {t('common.upgrade')}
          </BigButton>
        </Link>
      </div>
    </div>
  );
};
