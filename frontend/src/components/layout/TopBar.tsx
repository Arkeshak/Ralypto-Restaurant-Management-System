import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { OfflineBadge } from './OfflineBadge';
import { changeLanguage } from '../../i18n';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  LogOut,
  Layers,
  Menu,
} from 'lucide-react';
import type { PlanCode } from '../../api/types';
import { useUiStore } from '../../stores/ui.store';

export const TopBar: React.FC = () => {
  const { user, restaurant, plan, setMockPlan, logout } = useAuth();
  const { isSidebarOpen, setSidebarOpen } = useUiStore();
  const { t, i18n } = useTranslation();

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMockPlan(e.target.value as PlanCode);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 glass-panel border-b border-zinc-800">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 md:hidden touch-target flex items-center justify-center"
          aria-label="Toggle navigation"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Ralypto" className="w-8 h-8 rounded-lg" />
          <div className="hidden sm:block">
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              <span>{restaurant?.name || 'Ralypto Restaurant'}</span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-normal">
                {restaurant?.code || 'CEY101'}
              </span>
            </h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Offline Badge */}
        <OfflineBadge />

        {/* Mock Plan Switcher (Dev Mode) */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-700/80 text-xs">
          <Layers className="w-3.5 h-3.5 text-brand-500" />
          <span className="hidden md:inline font-semibold text-zinc-400">Plan:</span>
          <select
            value={plan?.code || 'standard'}
            onChange={handlePlanChange}
            aria-label="Subscription Plan Tier"
            className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
          >
            <option value="basic" className="bg-zinc-900 text-zinc-100">
              Basic
            </option>
            <option value="standard" className="bg-zinc-900 text-zinc-100">
              Standard
            </option>
            <option value="premium" className="bg-zinc-900 text-zinc-100">
              Premium ★
            </option>
          </select>
        </div>

        {/* Language Picker */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-zinc-900 border border-zinc-700/80 text-xs">
          <Globe className="w-3.5 h-3.5 text-zinc-400" />
          <select
            value={i18n.language}
            onChange={(e) => changeLanguage(e.target.value as any)}
            aria-label="Language Selection"
            className="bg-transparent font-medium text-white focus:outline-none cursor-pointer"
          >
            <option value="en" className="bg-zinc-900 text-zinc-100">
              English
            </option>
            <option value="si" className="bg-zinc-900 text-zinc-100">
              සිංහල
            </option>
            <option value="ta" className="bg-zinc-900 text-zinc-100">
              தமிழ்
            </option>
          </select>
        </div>

        {/* User Role Badge */}
        {user && (
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-zinc-800">
            <div className="w-8 h-8 rounded-full bg-brand-950 border border-brand-800 flex items-center justify-center text-xs font-bold text-brand-300">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <div className="text-left text-xs">
              <p className="font-semibold text-zinc-200">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[10px] uppercase font-bold text-brand-400 tracking-wider">
                {user.role}
              </p>
            </div>
          </div>
        )}

        {/* Sign Out */}
        <button
          onClick={logout}
          title={t('auth.signOut')}
          aria-label={t('auth.signOut')}
          className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-900/40 transition-colors touch-target flex items-center justify-center"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
