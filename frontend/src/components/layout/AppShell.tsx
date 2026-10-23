import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Lock,
  LogOut,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { navItems } from "./navItems";
import { PageTransition } from "./PageTransition";
import { useAuth } from "@/hooks/useAuth";
import { useFeature } from "@/hooks/useFeature";
import { OfflineBadge } from "@/components/common/OfflineBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useUiStore } from "@/stores/ui.store";
import { useTranslation } from "react-i18next";
import { SubscriptionBanner } from "./SubscriptionBanner";
import { FloatingHelpButton } from "@/components/common/FloatingHelpButton";
import { FirstLoginWalkthrough } from "@/components/common/FirstLoginWalkthrough";

export function AppShell() {
  const { user, restaurant, plan, logout } = useAuth();
  const hasFeature = useFeature();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { activeManagerPinModal, closeManagerPinModal } = useUiStore();

  const [showLangMenu, setShowLangMenu] = useState(false);

  // Filter items visible to this role
  const items = navItems.filter((i) => i.roles.includes(user.role as any));

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setShowLangMenu(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-text">
      {/* Sidebar: tablet and desktop */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
        <div className="flex h-16 items-center justify-between px-5 border-b border-border/40">
          <span className="text-xl font-bold tracking-tight text-brand">Ralypto</span>
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold capitalize text-brand">
            {user.role}
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {items.map(({ to, label, icon: Icon, feature }) => {
            const locked = feature ? !hasFeature(feature) : false;
            return (
              <NavLink
                key={to}
                to={locked ? `/upgrade?feature=${feature}` : to}
                className={({ isActive }) =>
                  cn(
                    "relative flex min-h-12 items-center gap-3 rounded-btn px-3 text-base font-medium text-text transition-colors hover:bg-bg",
                    isActive && !locked && "text-brand font-semibold"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && !locked && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-btn bg-brand-soft"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                    <Icon className="relative h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
                    <span className="relative flex-1 truncate">{label}</span>
                    {locked && (
                      <Lock className="relative h-4 w-4 text-muted" aria-label="Not in your plan" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-border/40 p-3">
          <div className="rounded-btn bg-bg p-2.5 flex items-center justify-between">
            <NavLink to="/subscription" className="min-w-0 flex-1 hover:opacity-80 transition-opacity">
              <p className="truncate text-xs font-semibold text-text">{user.name}</p>
              <p className="truncate text-xs text-muted capitalize flex items-center gap-1">
                <span>{plan?.name || "Standard Plan"}</span>
              </p>
            </NavLink>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-full text-muted hover:text-danger hover:bg-surface transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Subscription Status Banners (Grace period, Read-Only, Dev Mode Switcher) */}
        <SubscriptionBanner />

        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface/80 px-4 backdrop-blur-xl md:px-6 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <span className="truncate font-semibold text-lg text-text">{restaurant.name}</span>
            <span className="hidden text-xs rounded-full bg-brand-soft px-2.5 py-1 font-medium text-muted sm:inline">
              {restaurant.code}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <OfflineBadge />

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                aria-label="Switch Language"
                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium hover:bg-bg transition-colors"
              >
                <Globe className="h-4 w-4 text-muted" />
                <span className="uppercase">{i18n.language ? i18n.language.slice(0, 2) : "EN"}</span>
              </button>

              {showLangMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowLangMenu(false)} />
                  <div className="absolute right-0 mt-2 z-40 w-36 rounded-card border border-border bg-surface p-1 shadow-lg">
                    <button
                      onClick={() => changeLanguage("en")}
                      className="w-full text-left rounded-btn px-3 py-2 text-sm font-medium hover:bg-bg"
                    >
                      English
                    </button>
                    <button
                      onClick={() => changeLanguage("si")}
                      className="w-full text-left rounded-btn px-3 py-2 text-sm font-medium hover:bg-bg"
                    >
                      සිංහල (Sinhala)
                    </button>
                    <button
                      onClick={() => changeLanguage("ta")}
                      className="w-full text-left rounded-btn px-3 py-2 text-sm font-medium hover:bg-bg"
                    >
                      தமிழ் (Tamil)
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* User Profile on mobile */}
            <button
              onClick={handleLogout}
              className="md:hidden p-2 text-muted hover:text-danger"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="min-h-0 flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-6">
          <PageTransition />
        </main>

        {/* Bottom nav: phone (max 5 items) */}
        <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-surface md:hidden shadow-lg">
          {items.slice(0, 5).map(({ to, label, icon: Icon, feature }) => {
            const locked = feature ? !hasFeature(feature) : false;
            return (
              <NavLink
                key={to}
                to={locked ? `/upgrade?feature=${feature}` : to}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                    isActive && !locked ? "text-brand font-semibold" : "text-muted hover:text-text"
                  )
                }
              >
                <div className="relative">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  {locked && (
                    <Lock className="absolute -top-1 -right-2 h-3 w-3 text-muted" />
                  )}
                </div>
                <span>{label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Floating Help Button on every screen */}
      <FloatingHelpButton />

      {/* First-Login Walkthrough Modal */}
      <FirstLoginWalkthrough />

      {/* Global Manager PIN Modal */}
      <ConfirmDialog
        isOpen={activeManagerPinModal.isOpen}
        title={activeManagerPinModal.title}
        description={activeManagerPinModal.description}
        requiresPin={true}
        onConfirm={(pin) => {
          if (activeManagerPinModal.onSuccess && pin) {
            activeManagerPinModal.onSuccess(pin);
          }
          closeManagerPinModal();
        }}
        onCancel={closeManagerPinModal}
      />
    </div>
  );
}
