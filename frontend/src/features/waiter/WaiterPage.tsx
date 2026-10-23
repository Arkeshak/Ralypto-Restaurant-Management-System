import React from 'react';
import { Smartphone, CheckSquare, ListOrdered, BellRing } from 'lucide-react';
import { BigButton } from '../../components/common/BigButton';

export const WaiterPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl glass-card border border-zinc-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-2xl bg-brand-950/80 text-brand-500 border border-brand-800/60">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Waiter Mobile App</h1>
            <p className="text-sm text-zinc-400">
              Mobile & tablet ordering interface for floor captains and serving staff
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl glass-panel border border-zinc-800 space-y-4">
        <h3 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-brand-500" />
          <span>Implementation Roadmap (Feature Scope)</span>
        </h3>
        <ul className="space-y-3 text-sm text-zinc-300">
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs mt-0.5">1</span>
            <span><strong>Quick Table Picker:</strong> Tap table on floor map to bind waiter and start order session.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs mt-0.5">2</span>
            <span><strong>Single-Handed Cart:</strong> Bottom sheet drawer optimized for thumb scrolling and modifier customization.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs mt-0.5">3</span>
            <span><strong>Kitchen Status Buzzer:</strong> Real-time audio chime and vibration when KDS marks a dish "Ready".</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs mt-0.5">4</span>
            <span><strong>Idle Auto-Lock:</strong> Automatic lock screen to 4-digit numeric keypad on 60 seconds of inactivity.</span>
          </li>
        </ul>

        <div className="pt-4 border-t border-zinc-800 flex gap-3">
          <BigButton variant="brand" icon={<BellRing className="w-4 h-4" />}>
            Simulate Waiter Call
          </BigButton>
          <BigButton variant="secondary" icon={<ListOrdered className="w-4 h-4" />}>
            View Active Tables
          </BigButton>
        </div>
      </div>
    </div>
  );
};
