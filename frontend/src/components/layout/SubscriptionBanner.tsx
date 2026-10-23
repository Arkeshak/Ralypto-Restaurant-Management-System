import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, MessageCircle } from 'lucide-react';
import { useReadOnly, type SubscriptionStatus } from '@/hooks/useReadOnly';
import { useUiStore } from '@/stores/ui.store';
import { toast } from 'sonner';

export const SubscriptionBanner: React.FC = () => {
  const { isReadOnly, isGracePeriod, status } = useReadOnly();
  const { isDemoMode, setDemoMode } = useUiStore();
  const [, setRerender] = useState(0);

  const handleDevSwitchStatus = (newStatus: SubscriptionStatus) => {
    localStorage.setItem('ralypto_dev_sub_status', newStatus);
    setRerender((v) => v + 1);
    toast.info(`Switched dev subscription state to: ${newStatus.toUpperCase()}`);
    window.location.reload();
  };

  const isDevMock = import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true';

  if (!isReadOnly && !isGracePeriod && !isDevMock && !isDemoMode) {
    return null;
  }

  return (
    <>
      {/* 0. Practice Mode Ribbon */}
      {isDemoMode && (
        <div className="bg-neutral-900 text-neutral-100 px-4 py-1.5 flex items-center justify-between text-xs font-medium border-b border-neutral-800 z-30">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold tracking-wide">PRACTICE MODE</span>
            <span className="text-neutral-400 hidden sm:inline">— Sample training data active. Orders will not affect live reports.</span>
          </div>
          <button
            onClick={() => {
              setDemoMode(false);
              toast.info('Exited practice mode');
            }}
            className="text-[11px] font-semibold underline text-neutral-300 hover:text-white transition-colors"
          >
            Exit Practice Mode
          </button>
        </div>
      )}
      {/* 1. Grace Period Banner (Amber) */}
      {isGracePeriod && (
        <div className="bg-amber-500 text-black px-4 py-2 flex items-center justify-between text-xs font-bold shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Your plan expired. 5 days left in grace period. Pay now to avoid interruption.</span>
          </div>
          <a
            href="https://wa.me/94771234567?text=Hi%20Ralypto%20Team,%20I%20would%20like%20to%20renew%20my%20restaurant%20subscription."
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1 rounded-full bg-black text-white text-[11px] font-bold flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Pay via WhatsApp</span>
          </a>
        </div>
      )}

      {/* 2. Read-Only / Expired Banner (Red) */}
      {isReadOnly && (
        <div className="bg-rose-600 text-white px-4 py-2 flex items-center justify-between text-xs font-bold shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>
              Account in Read-Only Mode. All creation, edits, and payments are locked. Reading and printing still work.
            </span>
          </div>
          <a
            href="https://wa.me/94771234567?text=Hi%20Ralypto%20Team,%20I%20need%20to%20reactivate%20my%20account%20from%20read-only%20mode."
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1 rounded-full bg-white text-rose-600 text-[11px] font-bold flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Reactivate Now</span>
          </a>
        </div>
      )}

      {/* Dev Mode State Switcher (Dev Mocks only) */}
      {isDevMock && (
        <div className="bg-zinc-900 border-b border-zinc-800 text-zinc-300 px-4 py-1 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-400">Dev Subscription Test:</span>
            <span className="font-mono text-white uppercase">{status}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleDevSwitchStatus('active')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                status === 'active' ? 'bg-emerald-600 text-white' : 'hover:bg-zinc-800 text-zinc-400'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => handleDevSwitchStatus('grace_period')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                status === 'grace_period' ? 'bg-amber-500 text-black' : 'hover:bg-zinc-800 text-zinc-400'
              }`}
            >
              Grace Period
            </button>
            <button
              onClick={() => handleDevSwitchStatus('read_only')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                status === 'read_only' ? 'bg-rose-600 text-white' : 'hover:bg-zinc-800 text-zinc-400'
              }`}
            >
              Read-Only
            </button>
          </div>
        </div>
      )}
    </>
  );
};
