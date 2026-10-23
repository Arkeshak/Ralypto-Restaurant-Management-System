import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LayoutGrid, Smartphone, ChefHat, BarChart3, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const BottomNav: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  // Waiter or Cashier on mobile get quick thumb access
  const links = [
    { to: '/pos', icon: <LayoutGrid className="w-5 h-5" />, labelKey: 'nav.pos', roles: ['cashier', 'owner', 'manager'] },
    { to: '/waiter', icon: <Smartphone className="w-5 h-5" />, labelKey: 'nav.waiter', roles: ['waiter', 'owner', 'manager'] },
    { to: '/kitchen', icon: <ChefHat className="w-5 h-5" />, labelKey: 'nav.kitchen', roles: ['kitchen', 'owner', 'manager'] },
    { to: '/reports', icon: <BarChart3 className="w-5 h-5" />, labelKey: 'nav.reports', roles: ['owner', 'manager', 'accountant'] },
    { to: '/settings', icon: <Settings className="w-5 h-5" />, labelKey: 'nav.settings', roles: ['owner', 'manager'] },
  ].filter((item) => !user || item.roles.includes(user.role));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around h-16 glass-panel border-t border-zinc-800 md:hidden pb-safe">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition-colors ${
              isActive ? 'text-brand-500 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`
          }
        >
          {link.icon}
          <span className="mt-1">{t(link.labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
};
