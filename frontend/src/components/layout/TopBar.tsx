import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { OfflineBadge } from '../common/OfflineBadge';
import { ShiftStatusWidget } from './ShiftStatusWidget';
import { changeLanguage } from '../../i18n';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  LogOut,
  Layers,
  Menu,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import type { PlanCode } from '../../api/types';
import { useUiStore } from '../../stores/ui.store';

export const TopBar: React.FC = () => {
  const { user, restaurant, plan, setMockPlan, logout } = useAuth();
  const { isSidebarOpen, setSidebarOpen, themeMode, setThemeMode } = useUiStore();
  const { t, i18n } = useTranslation();

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMockPlan(e.target.value as PlanCode);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 glass-panel border-b border-border bg-surface/90 backdrop-blur-md">
      {/* Left: Mobile hamburger & Restaurant Metadata */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle navigation menu"
          className="p-2 -ml-2 rounded-xl text-muted hover:text-text hover:bg-bg md:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm md:text-base font-bold tracking-tight text-text">
              {restaurant?.name || 'Ralypto Restaurant'}
            </h1>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700">
              {restaurant?.code || 'CEY101'}
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls: ShiftStatusWidget, OfflineBadge, Dev Plan Switcher, Theme, Language, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Shift Drawer Status */}
        <ShiftStatusWidget />

        {/* Offline Badge */}
        <OfflineBadge />

        {/* Mock Plan Switcher (Visible ONLY during Dev with Mocks enabled) */}
        {import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === "true" && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface border border-border text-xs">
            <Layers className="w-3.5 h-3.5 text-brand" />
            <span className="hidden md:inline font-semibold text-muted">Dev Plan:</span>
            <select
              value={plan?.code || 'standard'}
              onChange={handlePlanChange}
              aria-label="Subscription Plan Tier"
              className="bg-transparent font-bold text-text focus:outline-none cursor-pointer"
            >
              <option value="basic" className="bg-surface text-text">
                Basic
              </option>
              <option value="standard" className="bg-surface text-text">
                Standard
              </option>
              <option value="premium" className="bg-surface text-text">
                Premium ★
              </option>
            </select>
          </div>
        )}

        {/* Theme Mode Toggle (Light / Dark / Auto) */}
        <div className="flex items-center rounded-xl border border-border bg-bg p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setThemeMode('light')}
            title="Light Mode"
            aria-label="Light Mode"
            className={`p-1.5 rounded-lg transition-colors ${
              themeMode === 'light'
                ? 'bg-surface text-text shadow-sm'
                : 'text-muted hover:text-text'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setThemeMode('dark')}
            title="Dark Mode"
            aria-label="Dark Mode"
            className={`p-1.5 rounded-lg transition-colors ${
              themeMode === 'dark'
                ? 'bg-surface text-text shadow-sm'
                : 'text-muted hover:text-text'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setThemeMode('auto')}
            title="Auto (System Theme)"
            aria-label="Auto (System Theme)"
            className={`p-1.5 rounded-lg transition-colors ${
              themeMode === 'auto'
                ? 'bg-surface text-text shadow-sm'
                : 'text-muted hover:text-text'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Language Picker */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-surface border border-border text-xs">
          <Globe className="w-3.5 h-3.5 text-muted" />
          <select
            value={i18n.language}
            onChange={(e) => changeLanguage(e.target.value as any)}
            aria-label="Language Selection"
            className="bg-transparent font-medium text-text focus:outline-none cursor-pointer"
          >
            <option value="en" className="bg-surface text-text">
              English
            </option>
            <option value="si" className="bg-surface text-text">
              සිංහල
            </option>
            <option value="ta" className="bg-surface text-text">
              தமிழ்
            </option>
          </select>
        </div>

        {/* User Role Badge */}
        {user && (
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-border">
            <div className="w-8 h-8 rounded-full bg-brand text-surface flex items-center justify-center text-xs font-bold shadow-sm">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <div className="text-left text-xs leading-tight">
              <p className="font-semibold text-text">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[10px] uppercase font-bold text-muted tracking-wider">
                {user.role}
              </p>
            </div>
          </div>
        )}

        {/* Sign Out */}
        <button
          type="button"
          onClick={logout}
          title={t('auth.signOut')}
          aria-label={t('auth.signOut')}
          className="p-2 rounded-xl text-muted hover:text-danger hover:bg-danger-soft border border-transparent hover:border-danger/30 transition-all"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
