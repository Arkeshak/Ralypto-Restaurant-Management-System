import { useState, useEffect } from "react";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { db } from "@/offline/db";
import { subscribeSyncState } from "@/offline/syncQueue";

export function OfflineBadge() {
  const online = useOnlineStatus();
  const [pendingOrders, setPendingOrders] = useState(0);
  const [syncState, setSyncState] = useState({ isSyncing: false, syncingCount: 0 });

  useEffect(() => {
    let active = true;
    const checkPending = async () => {
      try {
        const count = await db.offlineOrders.where("syncStatus").anyOf(["pending", "failed"]).count();
        if (active) setPendingOrders(count);
      } catch {
        if (active) setPendingOrders(0);
      }
    };

    checkPending();
    const interval = setInterval(checkPending, 3000);
    const unsubscribe = subscribeSyncState((st) => {
      if (active) {
        setSyncState(st);
        checkPending();
      }
    });

    return () => {
      active = false;
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  if (syncState.isSyncing) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-info-soft px-3 py-1 text-xs font-semibold text-info animate-pulse border border-info/20">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        <span>
          Syncing {syncState.syncingCount} order{syncState.syncingCount > 1 ? "s" : ""}...
        </span>
      </span>
    );
  }

  if (!online) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-3 py-1 text-xs font-semibold text-warning border border-warning/20">
        <WifiOff className="h-3.5 w-3.5" aria-hidden />
        <span>
          Offline {pendingOrders > 0 ? `- ${pendingOrders} order${pendingOrders > 1 ? "s" : ""} saved` : ""}
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success border border-success/20">
      <Wifi className="h-3.5 w-3.5" aria-hidden />
      <span>Online</span>
    </span>
  );
}
