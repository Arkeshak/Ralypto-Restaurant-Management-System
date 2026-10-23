import { Compass } from 'lucide-react';
import { BigButton } from '../../components/common/BigButton';
import { Link } from 'react-router-dom';

export const OnboardingPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="p-8 rounded-3xl glass-card border border-zinc-800 text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-950/80 text-brand-500 border border-brand-800/60 flex items-center justify-center mx-auto mb-4 glow-brand">
          <Compass className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">Welcome to Ralypto Restaurant OS</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
          Follow this 3-step walkthrough to get your floor, staff, and digital menu ready for operations.
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-6 rounded-2xl glass-panel border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="w-10 h-10 rounded-full bg-brand-950 text-brand-400 border border-brand-800 flex items-center justify-center font-bold text-sm">
              1
            </span>
            <div>
              <h3 className="font-bold text-white text-base">Configure Floor & Table Map</h3>
              <p className="text-xs text-zinc-400">Set up dining areas (AC Hall, Terrace) and table numbers</p>
            </div>
          </div>
          <Link to="/pos">
            <BigButton variant="secondary" size="sm">
              Setup Tables
            </BigButton>
          </Link>
        </div>

        <div className="p-6 rounded-2xl glass-panel border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="w-10 h-10 rounded-full bg-brand-950 text-brand-400 border border-brand-800 flex items-center justify-center font-bold text-sm">
              2
            </span>
            <div>
              <h3 className="font-bold text-white text-base">Build Menu Catalog & Modifiers</h3>
              <p className="text-xs text-zinc-400">Add dishes, set prices in LKR, and assign station routing</p>
            </div>
          </div>
          <Link to="/menu-manager">
            <BigButton variant="secondary" size="sm">
              Manage Menu
            </BigButton>
          </Link>
        </div>

        <div className="p-6 rounded-2xl glass-panel border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="w-10 h-10 rounded-full bg-brand-950 text-brand-400 border border-brand-800 flex items-center justify-center font-bold text-sm">
              3
            </span>
            <div>
              <h3 className="font-bold text-white text-base">Ring Your First Demo Order</h3>
              <p className="text-xs text-zinc-400">Test the POS register and fire a KOT ticket to the kitchen display</p>
            </div>
          </div>
          <Link to="/pos">
            <BigButton variant="brand" size="sm">
              Open POS Register
            </BigButton>
          </Link>
        </div>
      </div>
    </div>
  );
};
