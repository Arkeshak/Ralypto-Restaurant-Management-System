import { useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Receipt,
  Plus,
  Minus,
  ShoppingBag,
  X,
  CheckCircle2,
  Globe,
} from "lucide-react";
import { formatMoney } from "@/lib/formatMoney";
import { BigButton } from "@/components/common/BigButton";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { MOCK_CATEGORIES, MOCK_MENU_ITEMS } from "@/mocks/data/mockData";
import type { MenuItem } from "@/api/types";

export function QrMenuPage() {
  const { tableNumber = "5" } = useParams();
  const { i18n } = useTranslation();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<Array<{ item: MenuItem; qty: number }>>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderConfirmed, setIsOrderConfirmed] = useState(false);

  const filteredItems = MOCK_MENU_ITEMS.filter(
    (item) => selectedCategory === "all" || item.categoryId === selectedCategory
  );

  const handleAddToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.item.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.item.id === item.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { item, qty: 1 }];
    });
    toast.success(`Added ${item.name} to cart`);
  };

  const handleUpdateQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.item.id === itemId) {
            const newQty = i.qty + delta;
            return newQty > 0 ? { ...i, qty: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as Array<{ item: MenuItem; qty: number }>
    );
  };

  const cartTotalCents = cart.reduce(
    (sum, i) => sum + i.item.priceCents * i.qty,
    0
  );
  const totalItemCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const handleCallWaiter = () => {
    toast.success(`Waiter called to Table ${tableNumber}. Staff will be with you shortly.`);
  };

  const handleRequestBill = () => {
    toast.success(`Bill requested for Table ${tableNumber}. The cashier is preparing your receipt.`);
  };

  const handleConfirmOrder = () => {
    setIsOrderConfirmed(true);
    setCart([]);
    setIsCartOpen(false);
  };

  return (
    <div className="min-h-screen bg-bg text-text pb-28 selection:bg-brand selection:text-surface">
      {/* Top Customer Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-text">Ralypto Bistro</span>
              <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand">
                Table {tableNumber}
              </span>
            </div>
            <p className="text-xs text-muted">Digital Menu & Table Service</p>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-1 rounded-full border border-border bg-bg px-2 py-1 text-xs font-bold">
            <Globe className="h-3.5 w-3.5 text-muted mr-1" />
            <button
              onClick={() => i18n.changeLanguage("en")}
              className={i18n.language.startsWith("en") ? "text-brand font-extrabold" : "text-muted"}
            >
              EN
            </button>
            <span className="text-border">·</span>
            <button
              onClick={() => i18n.changeLanguage("si")}
              className={i18n.language.startsWith("si") ? "text-brand font-extrabold" : "text-muted"}
            >
              SI
            </button>
            <span className="text-border">·</span>
            <button
              onClick={() => i18n.changeLanguage("ta")}
              className={i18n.language.startsWith("ta") ? "text-brand font-extrabold" : "text-muted"}
            >
              TA
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-xl px-4 pt-4">
        {/* Quick Action Buttons: Call Waiter & Request Bill */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCallWaiter}
            className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-border bg-surface text-sm font-semibold text-text shadow-sm hover:bg-bg transition-colors"
          >
            <Bell className="h-4 w-4 text-brand" />
            <span>Call Waiter</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleRequestBill}
            className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-border bg-surface text-sm font-semibold text-text shadow-sm hover:bg-bg transition-colors"
          >
            <Receipt className="h-4 w-4 text-brand" />
            <span>Request Bill</span>
          </motion.button>
        </div>

        {/* Order Confirmed Banner if just sent */}
        {isOrderConfirmed && (
          <div className="mb-6 rounded-card border border-success/40 bg-success-soft p-5 text-center shadow-sm">
            <CheckCircle2 className="mx-auto h-10 w-10 text-success mb-2" />
            <h3 className="text-lg font-bold text-success">Order Received!</h3>
            <p className="mt-1 text-sm text-text">
              Your order was sent directly to our kitchen. You will receive updates at Table {tableNumber}.
            </p>
            <button
              onClick={() => setIsOrderConfirmed(false)}
              className="mt-3 text-xs font-semibold text-brand underline"
            >
              Order more items
            </button>
          </div>
        )}

        {/* Sticky Category Chips */}
        <div className="sticky top-14 z-20 -mx-4 px-4 py-2 bg-bg/95 backdrop-blur-md overflow-x-auto flex gap-2 border-b border-border/40 scrollbar-none mb-4">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold shrink-0 transition-colors ${
              selectedCategory === "all"
                ? "bg-brand text-surface"
                : "border border-border bg-surface text-text hover:bg-bg"
            }`}
          >
            All Items
          </button>
          {MOCK_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold shrink-0 transition-colors ${
                selectedCategory === cat.id
                  ? "bg-brand text-surface"
                  : "border border-border bg-surface text-text hover:bg-bg"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Items List */}
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const inCart = cart.find((i) => i.item.id === item.id);

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-card border border-border bg-surface p-3 shadow-card"
              >
                {/* Photo with fallback */}
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-brand-soft">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-muted">
                      Ralypto
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-base text-text truncate">{item.name}</h4>
                  <p className="text-xs text-muted line-clamp-1 mt-0.5">{item.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-base font-bold tabular-nums text-text">
                      {formatMoney(item.priceCents)}
                    </span>

                    {/* Add / Qty Controller */}
                    {inCart ? (
                      <div className="flex items-center gap-1.5 rounded-full border border-border bg-bg p-0.5">
                        <button
                          onClick={() => handleUpdateQty(item.id, -1)}
                          className="h-7 w-7 rounded-full flex items-center justify-center text-text hover:bg-surface"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold tabular-nums">
                          {inCart.qty}
                        </span>
                        <button
                          onClick={() => handleUpdateQty(item.id, 1)}
                          className="h-7 w-7 rounded-full flex items-center justify-center text-text hover:bg-surface"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAddToCart(item)}
                        className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-surface shadow-sm hover:bg-brand-hover transition-colors"
                      >
                        Add
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating Cart Bar at Bottom */}
      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 px-4">
          <div className="mx-auto max-w-xl">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCartOpen(true)}
              className="w-full flex h-14 items-center justify-between rounded-full bg-brand px-6 text-surface shadow-2xl"
            >
              <div className="flex items-center gap-2 font-semibold">
                <ShoppingBag className="h-5 w-5" />
                <span>
                  View Cart ({totalItemCount} {totalItemCount === 1 ? "item" : "items"})
                </span>
              </div>
              <span className="font-extrabold tabular-nums text-lg">
                {formatMoney(cartTotalCents)}
              </span>
            </motion.button>
          </div>
        </div>
      )}

      {/* Customer Cart Bottom Sheet Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
              className="w-full max-h-[85vh] rounded-t-3xl border-t border-border bg-surface p-6 shadow-2xl flex flex-col mx-auto max-w-xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border/40 shrink-0">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-text">Your Order</h3>
                  <p className="text-xs text-muted">Table {tableNumber}</p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-full text-muted hover:text-text"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {cart.map(({ item, qty }) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-border/60 p-3"
                  >
                    <div>
                      <h4 className="font-semibold text-sm text-text">{item.name}</h4>
                      <p className="text-xs text-muted">
                        {qty} × {formatMoney(item.priceCents)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full border border-border bg-bg p-0.5">
                      <button
                        onClick={() => handleUpdateQty(item.id, -1)}
                        className="h-7 w-7 rounded-full flex items-center justify-center text-text hover:bg-surface"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold tabular-nums">
                        {qty}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(item.id, 1)}
                        className="h-7 w-7 rounded-full flex items-center justify-center text-text hover:bg-surface"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total & Send Action */}
              <div className="pt-4 border-t border-border/40 shrink-0 space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-base font-bold text-text">Estimated Total</span>
                  <span className="text-2xl font-extrabold tabular-nums text-text">
                    {formatMoney(cartTotalCents)}
                  </span>
                </div>
                <BigButton
                  label="Confirm & Send to Kitchen"
                  variant="primary"
                  size="lg"
                  full
                  onClick={handleConfirmOrder}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default QrMenuPage;
