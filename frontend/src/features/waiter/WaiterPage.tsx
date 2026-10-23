import { useState } from "react";
import {
  LayoutGrid,
  ListOrdered,
  Bell,
  UtensilsCrossed,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  Send,
} from "lucide-react";
import { StatusPill } from "@/components/common/StatusPill";
import { BigButton } from "@/components/common/BigButton";
import { formatMoney } from "@/lib/formatMoney";
import { toast } from "sonner";
import { MOCK_MENU_ITEMS } from "@/mocks/data/mockData";

export function WaiterPage() {
  const [activeTab, setActiveTab] = useState<"tables" | "orders" | "ready" | "menu">("tables");
  const [selectedTable, setSelectedTable] = useState<string>("T2");

  // Waiter cart
  const [waiterCart, setWaiterCart] = useState<
    Array<{ id: string; name: string; priceCents: number; qty: number }>
  >([
    { id: "item-kottu-chick", name: "Chicken Kottu", priceCents: 145000, qty: 1 },
  ]);

  // Ready orders waiting for pickup
  const [readyItems, setReadyItems] = useState([
    { id: "r1", table: "T2", dish: "Chicken Kottu × 2", time: "2 min ago" },
    { id: "r2", table: "T5", dish: "Devilled Chicken × 1", time: "Just now" },
  ]);

  // Active orders
  const myOrders = [
    { id: "ord-1", table: "T2", status: "preparing", totalCents: 290000, itemsCount: 3 },
    { id: "ord-2", table: "T4", status: "ready", totalCents: 160000, itemsCount: 1 },
  ];

  const handleSimulateReadyAlert = () => {
    toast.success("Table T3: 2× Fresh Lime Soda is READY for pickup!", {
      duration: 5000,
    });
    setReadyItems((prev) => [
      { id: Date.now().toString(), table: "T3", dish: "Lime Soda × 2", time: "Just now" },
      ...prev,
    ]);
  };

  const handleSendOrder = () => {
    toast.success(`Order for ${selectedTable} sent to Kitchen`);
    setWaiterCart([]);
    setActiveTab("orders");
  };

  const cartTotalCents = waiterCart.reduce((sum, i) => sum + i.priceCents * i.qty, 0);

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col justify-between rounded-card border border-border bg-surface shadow-card overflow-hidden">
      {/* Top Bar for Waiter */}
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-3 bg-surface shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-text">Waiter Pad</span>
          <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand">
            Table: {selectedTable}
          </span>
        </div>
        <button
          onClick={handleSimulateReadyAlert}
          className="text-xs font-semibold rounded-full border border-border bg-bg px-3 py-1.5 hover:bg-surface text-muted hover:text-text transition-colors"
        >
          Test Ready Alert
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Tab 1: Tables Picker */}
        {activeTab === "tables" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Select Table to Order
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { number: "T1", status: "free" as const, seats: 2 },
                { number: "T2", status: "busy" as const, seats: 4 },
                { number: "T3", status: "busy" as const, seats: 6 },
                { number: "T4", status: "waiting" as const, seats: 4 },
                { number: "T5", status: "free" as const, seats: 2 },
                { number: "T6", status: "free" as const, seats: 4 },
              ].map((t) => (
                <button
                  key={t.number}
                  onClick={() => {
                    setSelectedTable(t.number);
                    setActiveTab("menu");
                  }}
                  className={`flex flex-col justify-between p-4 rounded-card border text-left min-h-28 transition-all ${
                    selectedTable === t.number
                      ? "border-brand bg-brand-soft shadow-sm"
                      : "border-border bg-surface hover:bg-bg"
                  }`}
                >
                  <span className="text-2xl font-bold text-text">{t.number}</span>
                  <div className="flex items-center justify-between mt-2">
                    <StatusPill tone={t.status} label={t.status} />
                    <span className="text-xs text-muted">{t.seats} seats</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: My Orders */}
        {activeTab === "orders" && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
              My Active Tables
            </h3>
            {myOrders.map((ord) => (
              <div
                key={ord.id}
                className="flex items-center justify-between p-4 rounded-card border border-border bg-surface"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-text">{ord.table}</span>
                    <span className="text-xs text-muted">#{ord.id}</span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">{ord.itemsCount} dishes ordered</p>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold tabular-nums text-text">
                    {formatMoney(ord.totalCents)}
                  </div>
                  <span className="text-xs font-semibold capitalize text-brand">
                    {ord.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Ready Dishes */}
        {activeTab === "ready" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
                Kitchen Pickup Queue
              </h3>
              <span className="text-xs font-bold rounded-full bg-success-soft text-success px-2 py-0.5">
                {readyItems.length} Ready
              </span>
            </div>

            {readyItems.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">No dishes currently waiting for pickup.</p>
            ) : (
              readyItems.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-4 rounded-card border border-success/40 bg-success-soft/30"
                >
                  <div>
                    <span className="text-xl font-extrabold text-text">{r.table}</span>
                    <p className="text-sm font-semibold text-text">{r.dish}</p>
                    <span className="text-xs text-muted flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" /> {r.time}
                    </span>
                  </div>
                  <BigButton
                    label="Served"
                    icon={CheckCircle2}
                    variant="success"
                    size="md"
                    onClick={() => {
                      setReadyItems((prev) => prev.filter((i) => i.id !== r.id));
                      toast.success(`Served ${r.dish} to ${r.table}`);
                    }}
                  />
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Thumb-Friendly Menu */}
        {activeTab === "menu" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
                Menu for {selectedTable}
              </h3>
              {waiterCart.length > 0 && (
                <span className="text-xs font-bold text-brand">
                  Cart: {formatMoney(cartTotalCents)}
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              {MOCK_MENU_ITEMS.map((item) => {
                const inCart = waiterCart.find((i) => i.id === item.id);

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface"
                  >
                    <div className="min-w-0 flex-1 mr-3">
                      <h4 className="text-base font-semibold text-text truncate">{item.name}</h4>
                      <p className="text-xs font-bold tabular-nums text-muted">
                        {formatMoney(item.priceCents)}
                      </p>
                    </div>

                    {inCart ? (
                      <div className="flex items-center gap-2 rounded-full border border-border bg-bg p-1">
                        <button
                          onClick={() => {
                            setWaiterCart((prev) =>
                              prev
                                .map((i) => (i.id === item.id ? { ...i, qty: i.qty - 1 } : i))
                                .filter((i) => i.qty > 0)
                            );
                          }}
                          className="h-8 w-8 rounded-full flex items-center justify-center text-text hover:bg-surface"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-5 text-center font-bold text-sm tabular-nums">
                          {inCart.qty}
                        </span>
                        <button
                          onClick={() => {
                            setWaiterCart((prev) =>
                              prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i))
                            );
                          }}
                          className="h-8 w-8 rounded-full flex items-center justify-center text-text hover:bg-surface"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <BigButton
                        label="Add"
                        icon={Plus}
                        variant="secondary"
                        size="md"
                        onClick={() => {
                          setWaiterCart((prev) => [
                            ...prev,
                            { id: item.id, name: item.name, priceCents: item.priceCents, qty: 1 },
                          ]);
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {waiterCart.length > 0 && (
              <div className="pt-2 sticky bottom-0 bg-surface">
                <BigButton
                  label={`Send Order (${waiterCart.length} items · ${formatMoney(cartTotalCents)})`}
                  icon={Send}
                  variant="primary"
                  full
                  size="lg"
                  onClick={handleSendOrder}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Waiter App Bottom Bar (Thumb navigation) */}
      <div className="grid grid-cols-4 border-t border-border bg-surface shrink-0">
        <button
          onClick={() => setActiveTab("tables")}
          className={`flex flex-col items-center justify-center py-3 text-xs font-semibold transition-colors ${
            activeTab === "tables" ? "text-brand" : "text-muted hover:text-text"
          }`}
        >
          <LayoutGrid className="h-5 w-5 mb-1" />
          Tables
        </button>

        <button
          onClick={() => setActiveTab("menu")}
          className={`flex flex-col items-center justify-center py-3 text-xs font-semibold transition-colors ${
            activeTab === "menu" ? "text-brand" : "text-muted hover:text-text"
          }`}
        >
          <UtensilsCrossed className="h-5 w-5 mb-1" />
          Menu
        </button>

        <button
          onClick={() => setActiveTab("ready")}
          className={`relative flex flex-col items-center justify-center py-3 text-xs font-semibold transition-colors ${
            activeTab === "ready" ? "text-brand" : "text-muted hover:text-text"
          }`}
        >
          <Bell className="h-5 w-5 mb-1" />
          Ready
          {readyItems.length > 0 && (
            <span className="absolute top-2 right-6 flex h-4 w-4 items-center justify-center rounded-full bg-success text-[10px] font-bold text-white">
              {readyItems.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          className={`flex flex-col items-center justify-center py-3 text-xs font-semibold transition-colors ${
            activeTab === "orders" ? "text-brand" : "text-muted hover:text-text"
          }`}
        >
          <ListOrdered className="h-5 w-5 mb-1" />
          Orders
        </button>
      </div>
    </div>
  );
}
export default WaiterPage;
