import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { Wifi, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const OfflineBadge: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { t } = useTranslation();

  if (isOnline) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
        <Wifi className="w-3.5 h-3.5 text-emerald-400" />
        <span>{t('common.online')}</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-700/60 animate-pulse">
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>{t('common.offline')}</span>
    </div>
  );
};
