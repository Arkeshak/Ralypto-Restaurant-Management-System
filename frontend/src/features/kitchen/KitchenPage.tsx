import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChefHat,
  Volume2,
  VolumeX,
  Clock,
  Utensils,
  Wine,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface KitchenTicketItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
}

interface KitchenTicket {
  id: string;
  orderNumber: string;
  tableNumber: string;
  orderType: "dine_in" | "takeaway";
  station: "kitchen" | "bar";
  status: "new" | "preparing" | "ready";
  items: KitchenTicketItem[];
  elapsedMinutes: number;
}

const initialTickets: KitchenTicket[] = [
  {
    id: "t-101",
    orderNumber: "ORD-881",
    tableNumber: "T2",
    orderType: "dine_in",
    station: "kitchen",
    status: "new",
    elapsedMinutes: 4,
    items: [
      { id: "1", name: "Chicken Kottu", quantity: 2, notes: "Extra spicy" },
      { id: "2", name: "Devilled Chicken", quantity: 1, notes: "No onions" },
    ],
  },
  {
    id: "t-102",
    orderNumber: "ORD-879",
    tableNumber: "T5",
    orderType: "dine_in",
    station: "kitchen",
    status: "preparing",
    elapsedMinutes: 14,
    items: [
      { id: "3", name: "Seafood Fried Rice", quantity: 1 },
      { id: "4", name: "Hot Butter Cuttlefish", quantity: 1, notes: "Very crispy" },
    ],
  },
  {
    id: "t-103",
    orderNumber: "ORD-872",
    tableNumber: "T3",
    orderType: "dine_in",
    station: "bar",
    status: "preparing",
    elapsedMinutes: 22,
    items: [
      { id: "5", name: "Fresh Lime Soda", quantity: 2 },
      { id: "6", name: "Mango Lassi", quantity: 1 },
    ],
  },
  {
    id: "t-104",
    orderNumber: "ORD-870",
    tableNumber: "Takeaway #14",
    orderType: "takeaway",
    station: "kitchen",
    status: "ready",
    elapsedMinutes: 18,
    items: [
      { id: "7", name: "Cheese Kottu", quantity: 1 },
    ],
  },
];

export function KitchenPage() {
  const [tickets, setTickets] = useState<KitchenTicket[]>(initialTickets);
  const [station, setStation] = useState<"all" | "kitchen" | "bar">("all");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Synthesize soft pleasant beep for new tickets
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // AudioContext may be blocked before interaction
    }
  };

  // Timer simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setTickets((prev) =>
        prev.map((t) => ({ ...t, elapsedMinutes: t.elapsedMinutes + 1 }))
      );
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleAdvanceStatus = (ticket: KitchenTicket) => {
    let nextStatus: "new" | "preparing" | "ready" | "done";
    let message = "";

    if (ticket.status === "new") {
      nextStatus = "preparing";
      message = `Started preparing ${ticket.tableNumber}`;
    } else if (ticket.status === "preparing") {
      nextStatus = "ready";
      message = `${ticket.tableNumber} is ready for service!`;
    } else {
      nextStatus = "done";
      message = `Collected ${ticket.tableNumber}`;
    }

    if (nextStatus === "done") {
      setTickets((prev) => prev.filter((t) => t.id !== ticket.id));
    } else {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, status: nextStatus } : t))
      );
    }

    toast.success(message);
    playAlertSound();
  };

  const handleRecallTicket = (ticket: KitchenTicket) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticket.id ? { ...t, status: "preparing" } : t))
    );
    toast.info(`Recalled ${ticket.tableNumber} back to Preparing queue`);
  };

  const filteredTickets = tickets.filter(
    (t) => station === "all" || t.station === station
  );

  const columns: Array<{ status: "new" | "preparing" | "ready"; label: string; count: number }> = [
    {
      status: "new",
      label: "New Orders",
      count: filteredTickets.filter((t) => t.status === "new").length,
    },
    {
      status: "preparing",
      label: "Preparing",
      count: filteredTickets.filter((t) => t.status === "preparing").length,
    },
    {
      status: "ready",
      label: "Ready for Pickup",
      count: filteredTickets.filter((t) => t.status === "ready").length,
    },
  ];

  const getTimerTone = (minutes: number) => {
    if (minutes >= 20) return "text-rose-400 bg-rose-500/20 border-rose-500/40 animate-pulse";
    if (minutes >= 10) return "text-amber-400 bg-amber-500/20 border-amber-500/40";
    return "text-muted bg-surface/50 border-border/40";
  };

  return (
    <div
      data-theme="dark"
      className="min-h-full rounded-card border border-border bg-black text-[#f5f5f7] p-4 md:p-6"
    >
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface border border-border">
            <ChefHat className="h-6 w-6 text-[#f5f5f7]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#f5f5f7]">Kitchen Board</h1>
            <p className="text-sm text-[#98989d]">Live kitchen display & order preparation queue</p>
          </div>
        </div>

        {/* Filters and Mute */}
        <div className="flex items-center gap-3">
          {/* Station Selector */}
          <div className="flex items-center rounded-full border border-border bg-surface p-1 text-sm font-semibold">
            <button
              onClick={() => setStation("all")}
              className={`rounded-full px-3 py-1.5 transition-colors ${
                station === "all" ? "bg-[#f5f5f7] text-black" : "text-[#98989d] hover:text-[#f5f5f7]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStation("kitchen")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
                station === "kitchen" ? "bg-[#f5f5f7] text-black" : "text-[#98989d] hover:text-[#f5f5f7]"
              }`}
            >
              <Utensils className="h-4 w-4" /> Kitchen
            </button>
            <button
              onClick={() => setStation("bar")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
                station === "bar" ? "bg-[#f5f5f7] text-black" : "text-[#98989d] hover:text-[#f5f5f7]"
              }`}
            >
              <Wine className="h-4 w-4" /> Bar
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute audio alerts" : "Unmute audio alerts"}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-[#98989d] hover:text-[#f5f5f7]"
          >
            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5 text-danger" />}
          </button>
        </div>
      </div>

      {/* 3 Columns: New / Preparing / Ready */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
        {columns.map((col) => {
          const colTickets = filteredTickets.filter((t) => t.status === col.status);

          return (
            <div key={col.status} className="flex flex-col rounded-card border border-border bg-surface/30 p-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/40 mb-4">
                <span className="font-semibold text-base text-[#f5f5f7]">{col.label}</span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-xs font-bold text-[#f5f5f7] border border-border">
                  {col.count}
                </span>
              </div>

              <div className="flex flex-col gap-4 overflow-y-auto">
                {colTickets.length === 0 ? (
                  <div className="flex h-36 flex-col items-center justify-center text-center text-xs text-[#98989d]">
                    No tickets in this stage
                  </div>
                ) : (
                  colTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex flex-col justify-between rounded-card border border-border bg-[#1c1c1e] p-4 shadow-lg transition-all"
                    >
                      {/* Ticket Header */}
                      <div>
                        <div className="flex items-start justify-between pb-2 border-b border-border/40">
                          <div>
                            <span className="text-2xl font-extrabold text-[#f5f5f7]">
                              {ticket.tableNumber}
                            </span>
                            <div className="text-xs text-[#98989d]">
                              {ticket.orderNumber} · {ticket.orderType === "takeaway" ? "Takeaway" : "Dine In"}
                            </div>
                          </div>

                          {/* Timer Badge */}
                          <div
                            className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold tabular-nums ${getTimerTone(
                              ticket.elapsedMinutes
                            )}`}
                          >
                            <Clock className="h-3.5 w-3.5" />
                            <span>{ticket.elapsedMinutes}m</span>
                          </div>
                        </div>

                        {/* Items List */}
                        <div className="py-3 space-y-2">
                          {ticket.items.map((item) => (
                            <div key={item.id} className="text-sm">
                              <div className="flex items-baseline justify-between font-semibold text-[#f5f5f7]">
                                <span className="flex-1 mr-2">{item.name}</span>
                                <span className="text-base font-extrabold">×{item.quantity}</span>
                              </div>
                              {item.notes && (
                                <div className="mt-1 px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs font-bold text-amber-300 tracking-wide">
                                  NOTE: {item.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Advance Button (Big touch target min 56px) */}
                      <div className="pt-2">
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleAdvanceStatus(ticket)}
                          className={`w-full min-h-14 rounded-full flex items-center justify-center gap-2 font-bold text-base transition-colors ${
                            ticket.status === "new"
                              ? "bg-[#f5f5f7] text-black hover:bg-white"
                              : ticket.status === "preparing"
                              ? "bg-emerald-600 text-white hover:opacity-90"
                              : "bg-[#2c2c2e] text-[#f5f5f7] border border-border hover:bg-[#3a3a3c]"
                          }`}
                        >
                          {ticket.status === "new" && (
                            <>
                              Start Preparing <ArrowRight className="h-5 w-5" />
                            </>
                          )}
                          {ticket.status === "preparing" && (
                            <>
                              Mark Ready <CheckCircle2 className="h-5 w-5" />
                            </>
                          )}
                          {ticket.status === "ready" && (
                            <>
                              Complete & Collect <CheckCircle2 className="h-5 w-5" />
                            </>
                          )}
                        </motion.button>

                        {ticket.status === "ready" && (
                          <button
                            type="button"
                            onClick={() => handleRecallTicket(ticket)}
                            className="w-full mt-2 h-9 rounded-xl border border-border text-xs font-semibold text-muted hover:text-[#f5f5f7] hover:bg-[#2c2c2e] transition-colors"
                          >
                            Recall to Preparing
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default KitchenPage;
