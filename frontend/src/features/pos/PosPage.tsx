import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ChevronUp, X, AlertTriangle } from "lucide-react";
import { CategoryList } from "./CategoryList";
import { MenuGrid } from "./MenuGrid";
import { OrderCartPanel, type CartItem } from "./OrderCartPanel";
import { ModifierSheet } from "./ModifierSheet";
import { PaymentModal } from "./PaymentModal";
import { ReceiptModal } from "./ReceiptModal";
import { DiscountModal } from "./DiscountModal";
import { HeldOrdersModal, type HeldOrder } from "./HeldOrdersModal";
import { OpenShiftModal } from "./shifts/OpenShiftModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { calcTotals } from "./cartMath";
import { formatMoney } from "@/lib/formatMoney";
import { useShiftStore } from "@/stores/shift.store";
import { menuApi } from "@/api/endpoints/menu";
import { tablesApi } from "@/api/endpoints/tables";
import { ordersApi } from "@/api/endpoints/orders";
import { useAuth } from "@/hooks/useAuth";
import type { Category, MenuItem, Modifier, Order } from "@/api/types";

export function PosPage() {
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get("table");
  const tableNumber = searchParams.get("number") || (tableId ? `T${tableId}` : undefined);
  const { restaurant } = useAuth();

  // Shift Store state
  const currentShift = useShiftStore((s) => s.currentShift);
  const fetchCurrentShift = useShiftStore((s) => s.fetchCurrentShift);
  const isShiftOpen = currentShift?.status === "open";
  const recordPaymentToShift = useShiftStore((s) => s.recordPaymentToShift);
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [serverOrderStatus, setServerOrderStatus] = useState<Order["status"] | null>(null);
  const [receiptOrderNumber, setReceiptOrderNumber] = useState("—");

  // Fetch current shift on mount if not already loaded
  useEffect(() => {
    fetchCurrentShift();
  }, [fetchCurrentShift]);

  useEffect(() => {
    let active = true;
    setMenuLoading(true);
    setMenuError(null);
    Promise.all([menuApi.getCategories(), menuApi.getItems()])
      .then(([nextCategories, nextItems]) => {
        if (!active) return;
        setCategories(nextCategories);
        setMenuItems(nextItems);
      })
      .catch((error: any) => {
        if (active) setMenuError(error?.message || "Failed to load menu from server.");
      })
      .finally(() => { if (active) setMenuLoading(false); });
    return () => { active = false; };
  }, []);

  // Categories & Filtering
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Discount & Charges state
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountCents, setDiscountCents] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>("");
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [serviceChargeEnabled, setServiceChargeEnabled] = useState<boolean>(true);

  // Held Orders state
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);

  // Modal states
  const [selectedItemForModifiers, setSelectedItemForModifiers] = useState<MenuItem | null>(null);
  const [isModifierOpen, setIsModifierOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isVoidPromptOpen, setIsVoidPromptOpen] = useState(false);
  const [isMobileOrderOpen, setIsMobileOrderOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!tableId) return;
    let active = true;
    Promise.all([tablesApi.getTables(), ordersApi.getOrders()]).then(async ([tables, orders]) => {
      const table = tables.find((entry) => entry.id === tableId || entry.number === tableNumber);
      const existing = table?.activeOrderId ? orders.find((entry) => entry.id === table.activeOrderId) : null;
      if (!active || !existing) return;
      setOrderId(existing.id);
      setServerOrderStatus(existing.status);
      setReceiptOrderNumber(existing.orderNumber);
      setCartItems(existing.items.map((item) => ({
        id: item.menuItemId,
        name: item.name,
        priceCents: item.unitPriceCents,
        qty: item.quantity,
        notes: item.notes || undefined,
      })));
      setDiscountCents(existing.discountCents || 0);
    }).catch((error: any) => toast.error(error?.message || "Failed to load table order."));
    return () => { active = false; };
  }, [tableId, tableNumber]);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => item.isAvailable).filter((item) => {
      const categoryMatch =
        selectedCategoryId === "all" || item.categoryId === selectedCategoryId;
      const searchMatch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return categoryMatch && searchMatch;
    });
  }, [menuItems, selectedCategoryId, searchQuery]);

  // Cart Calculations with standard 10% tax and conditional service charge & discounts
  const totals = useMemo(() => {
    return calcTotals(
      cartItems.map((i) => ({ priceCents: i.priceCents, qty: i.qty })),
      {
        discountPercent,
        discountCents,
        servicePercent: serviceChargeEnabled ? restaurant.serviceChargeRate * 100 : 0,
        taxPercent: restaurant.taxRate * 100,
      }
    );
  }, [cartItems, discountPercent, discountCents, serviceChargeEnabled]);

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

  const createOrderFromCart = async () => {
    if (cartItems.length === 0) throw new Error("Add at least one available menu item first.");
    const created = await ordersApi.createOrder({
      tableId: tableId || undefined,
      orderType: tableId ? "dine_in" : "takeaway",
      discountCents,
      serviceChargeEnabled,
      items: cartItems.map((item) => ({ menuItemId: item.id, quantity: item.qty, notes: item.notes })),
    });
    setOrderId(created.id);
    setReceiptOrderNumber(created.orderNumber);
    setServerOrderStatus(created.status);
    return created;
  };

  const handleSendToKitchen = () => {
    if (serverOrderStatus && !["draft", "confirmed"].includes(serverOrderStatus)) {
      toast.error("This order has already been sent to the kitchen.");
      return;
    }
    setIsSending(true);
    void (async () => {
      try {
        const created = orderId ? null : await createOrderFromCart();
        const id = orderId || created!.id;
        await ordersApi.sendToKitchen(id);
        setServerOrderStatus("preparing");
        toast.success("Order sent to Kitchen");
        setIsMobileOrderOpen(false);
      } catch (error: any) {
        toast.error(error?.message || "Failed to send order to kitchen.");
      } finally {
        setIsSending(false);
      }
    })();
  };

  const handlePrintBill = async () => {
    try {
      const created = orderId ? null : await createOrderFromCart();
      const id = orderId || created!.id;
      if (serverOrderStatus !== "billed") await ordersApi.requestBill(id);
      setServerOrderStatus("billed");
      setIsReceiptOpen(true);
    } catch (error: any) {
      toast.error(error?.message || "Failed to prepare bill.");
    }
  };

  const handleOpenPay = () => {
    if (!isShiftOpen) {
      toast.error("Shift is closed. You must open a cash drawer shift to accept payments.");
      setIsOpenShiftModalOpen(true);
      return;
    }
    setIsPayOpen(true);
  };

  const handleConfirmPayment = async (paymentResult: any) => {
    try {
      const created = orderId ? null : await createOrderFromCart();
      const id = orderId || created!.id;
      if (serverOrderStatus !== "billed") await ordersApi.requestBill(id);
      const method = paymentResult.method === "mixed" ? "mixed" : paymentResult.paymentMethod || paymentResult.method;
      const settled = await ordersApi.pay(id, method === "mixed" ? {
        paymentMethod: "mixed",
        allocations: [
          { paymentMethod: "cash", amountCents: paymentResult.cashCents || 0 },
          { paymentMethod: "card", amountCents: paymentResult.cardCents || 0 },
        ],
      } : {
        paymentMethod: method,
        amountCents: paymentResult.method === "split" ? paymentResult.paidAmountCents : undefined,
        tenderedCents: method === "cash" ? paymentResult.tenderedCents : undefined,
      });
      setReceiptOrderNumber(settled.order.orderNumber);
      settled.payments.forEach((payment) => {
        const shiftMethod = payment.paymentMethod === "cash" ? "cash" : payment.paymentMethod as "card" | "qr_code";
        recordPaymentToShift(shiftMethod, payment.amountCents);
      });
      if (settled.outstandingCents > 0) {
        setServerOrderStatus("billed");
        toast.success(`${formatMoney(settled.amountPaidCents)} recorded. ${formatMoney(settled.outstandingCents)} remains.`);
        return;
      }
      setIsPayOpen(false);
      setIsMobileOrderOpen(false);
      toast.success(`Payment settled via ${String(paymentResult.method).toUpperCase()}`);
      setIsReceiptOpen(true);
      setCartItems([]);
      setDiscountPercent(0);
      setDiscountCents(0);
      setDiscountReason("");
      setOrderId(null);
      setServerOrderStatus("completed");
    } catch (error: any) {
      toast.error(error?.message || "Payment could not be completed.");
    }
  };

  const handleHoldOrder = () => {
    if (cartItems.length === 0) return;
    const newHeld: HeldOrder = {
      id: `held-${Date.now()}`,
      orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      tableNumber,
      items: [...cartItems],
      totals: { ...totals },
      heldAt: new Date().toISOString(),
    };
    setHeldOrders((prev) => [newHeld, ...prev]);
    setCartItems([]);
    setDiscountPercent(0);
    setDiscountCents(0);
    setDiscountReason("");
    toast.success(`Order held on Table ${tableNumber || "Direct"} (${newHeld.orderNumber})`);
  };

  const handleRecallOrder = (order: HeldOrder) => {
    setCartItems(order.items);
    setHeldOrders((prev) => prev.filter((o) => o.id !== order.id));
    toast.success(`Recalled order ${order.orderNumber}`);
  };

  const handleDeleteHeldOrder = (id: string) => {
    setHeldOrders((prev) => prev.filter((o) => o.id !== id));
    toast.info("Held order discarded");
  };

  const handleConfirmVoid = async (pin?: string) => {
    if (orderId) {
      try {
        await ordersApi.voidOrder(orderId, { managerPin: pin || "", reason: "Voided from POS" });
      } catch (error: any) {
        toast.error(error?.message || "Manager authorization failed.");
        return;
      }
    }
    if (pin) {
      setCartItems([]);
      setDiscountPercent(0);
      setDiscountCents(0);
      setDiscountReason("");
      setIsVoidPromptOpen(false);
      setIsMobileOrderOpen(false);
      toast.success("Order voided by Manager");
    } else {
      toast.error("Incorrect Manager PIN (Try 2222 or 1111)");
    }
  };

  const totalItemCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  return (
    <div className="relative flex h-[calc(100vh-6rem)] w-full overflow-hidden rounded-card border border-border bg-surface shadow-card">
      {/* Shift Closed Warning Banner */}
      {!isShiftOpen && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs font-semibold text-amber-800 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>Cash Drawer Shift is closed. Billing and checkout are locked.</span>
          </div>
          <button
            onClick={() => setIsOpenShiftModalOpen(true)}
            className="px-3 py-1 rounded-full bg-brand text-surface font-bold hover:opacity-90 active:scale-95 transition-all"
          >
            Open Shift
          </button>
        </div>
      )}

      {/* Column 1: Categories (Left) - Hidden on phone */}
      <div className={`hidden w-52 shrink-0 border-r border-border overflow-y-auto lg:block ${!isShiftOpen ? "pt-10" : ""}`}>
        <CategoryList
          categories={categories}
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
          {categories.map((cat) => (
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
          {menuLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted">Loading menu…</div>
          ) : menuError ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-danger">
              <span>{menuError}</span>
              <button className="rounded-full border border-border px-4 py-2 text-text" onClick={() => { setMenuLoading(true); void Promise.all([menuApi.getCategories(), menuApi.getItems()]).then(([nextCategories, nextItems]) => { setCategories(nextCategories); setMenuItems(nextItems); setMenuError(null); }).catch((error: any) => setMenuError(error?.message || "Failed to load menu.")).finally(() => setMenuLoading(false)); }}>Retry</button>
            </div>
          ) : (
            <MenuGrid
              items={filteredItems}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectItem={handleSelectItem}
            />
          )}
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
          onOpenDiscount={() => setIsDiscountModalOpen(true)}
          serviceChargeEnabled={serviceChargeEnabled}
          onToggleServiceCharge={() => setServiceChargeEnabled(!serviceChargeEnabled)}
          onOpenHeldOrders={() => setIsHeldModalOpen(true)}
          heldOrdersCount={heldOrders.length}
          discountReason={discountReason}
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
                  onOpenDiscount={() => setIsDiscountModalOpen(true)}
                  serviceChargeEnabled={serviceChargeEnabled}
                  onToggleServiceCharge={() => setServiceChargeEnabled(!serviceChargeEnabled)}
                  onOpenHeldOrders={() => setIsHeldModalOpen(true)}
                  heldOrdersCount={heldOrders.length}
                  discountReason={discountReason}
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
        items={cartItems}
        onClose={() => setIsPayOpen(false)}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* 80mm Receipt Preview Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        orderNumber={receiptOrderNumber}
        tableNumber={tableNumber}
        items={cartItems.map((i) => ({
          ...i,
          modifiers: i.modifiers?.map((m) => m.name),
        }))}
        totals={totals}
        onClose={() => setIsReceiptOpen(false)}
        onPrint={() => toast.success("Bill sent to 80mm thermal printer")}
      />

      {/* Discount Modal */}
      <DiscountModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        subtotalCents={totals.subtotal}
        currentDiscountPercent={discountPercent}
        currentDiscountCents={discountCents}
        currentReason={discountReason}
        onApply={(d) => {
          setDiscountPercent(d.percent);
          setDiscountCents(d.cents);
          setDiscountReason(d.reason);
        }}
        onRemove={() => {
          setDiscountPercent(0);
          setDiscountCents(0);
          setDiscountReason("");
        }}
      />

      {/* Held Orders Modal */}
      <HeldOrdersModal
        isOpen={isHeldModalOpen}
        onClose={() => setIsHeldModalOpen(false)}
        heldOrders={heldOrders}
        onRecall={handleRecallOrder}
        onDelete={handleDeleteHeldOrder}
      />

      {/* Open Shift Modal */}
      <OpenShiftModal
        isOpen={isOpenShiftModalOpen}
        onClose={() => setIsOpenShiftModalOpen(false)}
        onSuccess={() => toast.success("Shift opened! You can now accept payments.")}
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
