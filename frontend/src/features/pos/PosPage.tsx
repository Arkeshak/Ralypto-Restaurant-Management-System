import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ChevronUp, X } from "lucide-react";
import { CategoryList } from "./CategoryList";
import { MenuGrid } from "./MenuGrid";
import { OrderCartPanel, type CartItem } from "./OrderCartPanel";
import { ModifierSheet } from "./ModifierSheet";
import { PaymentModal } from "./PaymentModal";
import { ReceiptModal } from "./ReceiptModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { calcTotals } from "./cartMath";
import { formatMoney } from "@/lib/formatMoney";
import { MOCK_CATEGORIES, MOCK_MENU_ITEMS } from "@/mocks/data/mockData";
import type { MenuItem, Modifier } from "@/api/types";

export function PosPage() {
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get("table");
  const tableNumber = searchParams.get("number") || (tableId ? `T${tableId}` : undefined);

  // Categories & Filtering
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: "item-kottu-chick",
      name: "Chicken Kottu",
      priceCents: 145000,
      qty: 1,
      notes: "Extra chili paste",
    },
    {
      id: "item-starter-hbc",
      name: "Hot Butter Cuttlefish (HBC)",
      priceCents: 220000,
      qty: 1,
    },
  ]);

  // Modal states
  const [selectedItemForModifiers, setSelectedItemForModifiers] = useState<MenuItem | null>(null);
  const [isModifierOpen, setIsModifierOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isVoidPromptOpen, setIsVoidPromptOpen] = useState(false);
  const [isMobileOrderOpen, setIsMobileOrderOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return MOCK_MENU_ITEMS.filter((item) => {
      const categoryMatch =
        selectedCategoryId === "all" || item.categoryId === selectedCategoryId;
      const searchMatch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return categoryMatch && searchMatch;
    });
  }, [selectedCategoryId, searchQuery]);

  // Cart Calculations with standard 10% tax and 10% service
  const totals = useMemo(() => {
    return calcTotals(
      cartItems.map((i) => ({ priceCents: i.priceCents, qty: i.qty })),
      { servicePercent: 10, taxPercent: 10 }
    );
  }, [cartItems]);

  const handleSelectItem = (item: MenuItem) => {
    if (item.modifiers && item.modifiers.length > 0) {
      setSelectedItemForModifiers(item);
      setIsModifierOpen(true);
      return;
    }

    // Direct add
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          priceCents: item.priceCents,
          qty: 1,
        },
      ];
    });
  };

  const handleConfirmModifiers = (item: MenuItem, mods: Modifier[]) => {
    const extraPrice = mods.reduce((sum, m) => sum + m.priceDeltaCents, 0);
    const uniqueId = `${item.id}-${mods.map((m) => m.id).join("-")}`;

    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === uniqueId);
      if (existing) {
        return prev.map((i) =>
          i.id === uniqueId ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: uniqueId,
          name: item.name,
          priceCents: item.priceCents + extraPrice,
          qty: 1,
          modifiers: mods,
        },
      ];
    });
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    setCartItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, notes } : i))
    );
  };

  const handleSendToKitchen = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      toast.success("Order sent to Kitchen");
      setIsMobileOrderOpen(false);
    }, 450);
  };

  const handlePrintBill = () => {
    setIsReceiptOpen(true);
  };

  const handleOpenPay = () => {
    setIsPayOpen(true);
  };

  const handleConfirmPayment = (method: string) => {
    setIsPayOpen(false);
    setIsMobileOrderOpen(false);
    toast.success(`Payment of ${formatMoney(totals.total)} settled via ${method.toUpperCase()}`);
    // Clear cart or redirect
    setCartItems([]);
  };

  const handleHoldOrder = () => {
    toast.success("Order held on Table " + (tableNumber || "Direct"));
  };

  const handleConfirmVoid = (pin?: string) => {
    if (pin === "1234" || pin === "2222") {
      setCartItems([]);
      setIsVoidPromptOpen(false);
      setIsMobileOrderOpen(false);
      toast.success("Order voided by Manager");
    } else {
      toast.error("Incorrect Manager PIN");
    }
  };

  const totalItemCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  return (
    <div className="relative flex h-[calc(100vh-6rem)] w-full overflow-hidden rounded-card border border-border bg-surface shadow-card">
      {/* Column 1: Categories (Left) - Hidden on phone */}
      <div className="hidden w-52 shrink-0 border-r border-border overflow-y-auto lg:block">
        <CategoryList
          categories={MOCK_CATEGORIES}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />
      </div>

      {/* Column 2: Menu Grid (Centre) */}
      <div className="flex-1 min-w-0 h-full overflow-hidden flex flex-col">
        {/* On Mobile: Horizontal Category Scroller */}
        <div className="flex lg:hidden overflow-x-auto gap-2 p-2 border-b border-border/40 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryId("all")}
            className={`rounded-full px-3 py-1 text-xs font-semibold shrink-0 transition-colors ${
              selectedCategoryId === "all"
                ? "bg-brand text-surface"
                : "border border-border bg-surface text-text"
            }`}
          >
            All Items
          </button>
          {MOCK_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold shrink-0 transition-colors ${
                selectedCategoryId === cat.id
                  ? "bg-brand text-surface"
                  : "border border-border bg-surface text-text"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0">
          <MenuGrid
            items={filteredItems}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectItem={handleSelectItem}
          />
        </div>
      </div>

      {/* Column 3: Current Order (Right) - Desktop/Tablet */}
      <div className="hidden w-80 shrink-0 md:block lg:w-96">
        <OrderCartPanel
          tableNumber={tableNumber}
          items={cartItems}
          totals={totals}
          onUpdateQty={handleUpdateQty}
          onRemoveItem={handleRemoveItem}
          onUpdateNotes={handleUpdateNotes}
          onSendToKitchen={handleSendToKitchen}
          onPrintBill={handlePrintBill}
          onOpenPay={handleOpenPay}
          onHoldOrder={handleHoldOrder}
          onVoidOrder={() => setIsVoidPromptOpen(true)}
          isSending={isSending}
        />
      </div>

      {/* Phone: Sticky Bottom "View Order" Bar */}
      <div className="fixed inset-x-0 bottom-16 z-30 p-3 md:hidden">
        {cartItems.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsMobileOrderOpen(true)}
            className="w-full flex h-14 items-center justify-between rounded-full bg-brand px-5 text-surface shadow-2xl"
          >
            <div className="flex items-center gap-2 font-semibold">
              <ShoppingBag className="h-5 w-5" />
              <span>
                View Order ({totalItemCount} {totalItemCount === 1 ? "item" : "items"})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tabular-nums">{formatMoney(totals.total)}</span>
              <ChevronUp className="h-5 w-5" />
            </div>
          </motion.button>
        )}
      </div>

      {/* Phone: Order Bottom Sheet Drawer */}
      <AnimatePresence>
        {isMobileOrderOpen && (
          <div className="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm md:hidden">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
              className="w-full h-[90vh] rounded-t-3xl border-t border-border bg-surface flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-3 border-b border-border/40">
                <span className="font-bold text-text">Order Items</span>
                <button
                  onClick={() => setIsMobileOrderOpen(false)}
                  className="p-1 rounded-full text-muted hover:text-text"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 min-h-0">
                <OrderCartPanel
                  tableNumber={tableNumber}
                  items={cartItems}
                  totals={totals}
                  onUpdateQty={handleUpdateQty}
                  onRemoveItem={handleRemoveItem}
                  onUpdateNotes={handleUpdateNotes}
                  onSendToKitchen={handleSendToKitchen}
                  onPrintBill={handlePrintBill}
                  onOpenPay={handleOpenPay}
                  onHoldOrder={handleHoldOrder}
                  onVoidOrder={() => setIsVoidPromptOpen(true)}
                  isSending={isSending}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modifiers Sheet */}
      <ModifierSheet
        item={selectedItemForModifiers}
        isOpen={isModifierOpen}
        onClose={() => {
          setIsModifierOpen(false);
          setSelectedItemForModifiers(null);
        }}
        onConfirm={handleConfirmModifiers}
      />

      {/* Payment Settlement Modal */}
      <PaymentModal
        isOpen={isPayOpen}
        totalCents={totals.total}
        onClose={() => setIsPayOpen(false)}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* 80mm Receipt Preview Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        orderNumber="ORD-882"
        tableNumber={tableNumber}
        items={cartItems.map((i) => ({
          ...i,
          modifiers: i.modifiers?.map((m) => m.name),
        }))}
        totals={totals}
        onClose={() => setIsReceiptOpen(false)}
        onPrint={() => toast.success("Bill sent to 80mm thermal printer")}
      />

      {/* Void Manager PIN Modal */}
      <ConfirmDialog
        isOpen={isVoidPromptOpen}
        title="Void Current Order"
        description="Canceling an active order requires manager authorization."
        confirmLabel="Void Order"
        isDestructive={true}
        requiresPin={true}
        onConfirm={handleConfirmVoid}
        onCancel={() => setIsVoidPromptOpen(false)}
      />
    </div>
  );
}
export default PosPage;
