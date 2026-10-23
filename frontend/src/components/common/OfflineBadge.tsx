import { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { db } from "@/offline/db";

export function OfflineBadge() {
  const online = useOnlineStatus();
  const [pendingOrders, setPendingOrders] = useState(0);

  useEffect(() => {
    let active = true;
    const checkPending = async () => {
      try {
        const count = await db.offlineOrders.where("syncStatus").equals("pending").count();
        if (active) setPendingOrders(count);
      } catch {
        if (active) setPendingOrders(0);
      }
    };

    checkPending();
    const interval = setInterval(checkPending, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return online ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-sm font-medium text-success">
      <Wifi className="h-4 w-4" aria-hidden />
      <span>Online</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-3 py-1 text-sm font-medium text-warning">
      <WifiOff className="h-4 w-4" aria-hidden />
      <span>Offline - saving orders {pendingOrders > 0 ? `(${pendingOrders})` : ""}</span>
    </span>
  );
}
