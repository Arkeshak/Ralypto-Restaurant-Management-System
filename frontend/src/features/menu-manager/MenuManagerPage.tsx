import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  UtensilsCrossed,
  Plus,
  Search,
  Check,
  X,
  Upload,
  Edit2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { BigButton } from "@/components/common/BigButton";
import { EmptyState } from "@/components/common/EmptyState";
import { formatMoney } from "@/lib/formatMoney";
import { toast } from "sonner";
import { useReadOnly } from "@/hooks/useReadOnly";
import { menuApi } from "@/api/endpoints/menu";
import { MOCK_CATEGORIES, MOCK_MENU_ITEMS } from "@/mocks/data/mockData";
import type { MenuItem } from "@/api/types";

export function MenuManagerPage() {
  const { isReadOnly, preventInReadOnly } = useReadOnly();
  const [items, setItems] = useState<MenuItem[]>(MOCK_MENU_ITEMS);
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>("");
  const parentRef = useRef<HTMLDivElement>(null);

  // Add Item Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(MOCK_CATEGORIES[0]?.id || "");
  const [priceRupees, setPriceRupees] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [station, setStation] = useState<"kitchen" | "bar">("kitchen");
  const [isVeg, setIsVeg] = useState(false);

  // More options
  const [costRupees, setCostRupees] = useState("");
  const [isSpicy, setIsSpicy] = useState(false);
  const [description, setDescription] = useState("");
  const [modifierName, setModifierName] = useState("");
  const [modifierPrice, setModifierPrice] = useState("");
  const [modifiers, setModifiers] = useState<Array<{ id: string; name: string; priceDeltaCents: number }>>([]);

  // Filtering
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat = selectedCat === "all" || item.categoryId === selectedCat;
      const matchSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [items, selectedCat, searchQuery]);

  const rowVirtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5,
  });

  // Toggle availability in 1 tap (optimistic with rollback)
  const handleToggleAvailability = async (item: MenuItem) => {
    if (isReadOnly) {
      toast.error("Action blocked: Your account is in Read-Only mode. Please renew your plan.");
      return;
    }
    const previousAvailable = item.isAvailable;
    const nextAvailable = !previousAvailable;

    // 1. Optimistic immediate update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isAvailable: nextAvailable } : i))
    );
    if (nextAvailable) {
      toast.success(`${item.name} is now Available`);
    } else {
      toast.warning(`${item.name} marked as Sold Out`);
    }

    // 2. Perform backend update
    try {
      await menuApi.updateItem(item.id, { isAvailable: nextAvailable });
    } catch {
      // 3. Rollback if call fails
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isAvailable: previousAvailable } : i))
      );
      toast.error(`Failed to update ${item.name}. Reverting to ${previousAvailable ? 'Available' : 'Sold Out'}.`);
    }
  };

  // Inline Price Edit
  const handleSavePrice = (id: string) => {
    if (isReadOnly) {
      toast.error("Action blocked: Your account is in Read-Only mode. Please renew your plan.");
      setEditingPriceId(null);
      return;
    }
    const parsed = parseFloat(tempPrice);
    if (!isNaN(parsed) && parsed > 0) {
      const newCents = Math.round(parsed * 100);
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, priceCents: newCents } : i))
      );
      toast.success(`Price updated to ${formatMoney(newCents)}`);
    }
    setEditingPriceId(null);
  };

  // Add Item Handler
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      toast.error("Action blocked: Your account is in Read-Only mode. Please renew your plan.");
      return;
    }
    if (!name || !priceRupees) {
      toast.error("Please fill in item name and selling price.");
      return;
    }

    const priceCents = Math.round(parseFloat(priceRupees) * 100);
    const costCents = costRupees ? Math.round(parseFloat(costRupees) * 100) : Math.round(priceCents * 0.45);

    const newItem: MenuItem = {
      id: `item-${Date.now()}`,
      categoryId,
      name,
      description: description || "Freshly prepared house special",
      priceCents,
      costCents,
      imageUrl: photoPreview || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
      isVeg,
      isSpicy,
      isAvailable: true,
      modifiers: modifiers.length > 0 ? modifiers : undefined,
    };

    setItems((prev) => [newItem, ...prev]);
    toast.success(`Added ${name} to Menu`);
    setIsDrawerOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setPriceRupees("");
    setPhotoPreview("");
    setStation("kitchen");
    setIsVeg(false);
    setCostRupees("");
    setIsSpicy(false);
    setDescription("");
    setModifiers([]);
    setShowMoreOptions(false);
  };

  const handleAddModifier = () => {
    if (!modifierName || !modifierPrice) return;
    const delta = Math.round(parseFloat(modifierPrice) * 100);
    setModifiers((prev) => [
      ...prev,
      { id: `mod-${Date.now()}`, name: modifierName, priceDeltaCents: delta },
    ]);
    setModifierName("");
    setModifierPrice("");
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Menu Catalog"
        description="Search dishes, toggle sold out items in 1 tap, and edit prices."
        action={{
          label: "Add Item",
          icon: Plus,
          onClick: preventInReadOnly(() => setIsDrawerOpen(true)),
        }}
      />

      {/* Search and Category Filters */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dish or ingredients..."
            className="w-full h-11 pl-10 pr-4 rounded-full border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-info shadow-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCat("all")}
            className={`rounded-full px-4 py-2 text-xs font-semibold shrink-0 transition-colors ${
              selectedCat === "all"
                ? "bg-brand text-surface"
                : "border border-border bg-surface text-text hover:bg-bg"
            }`}
          >
            All Items ({items.length})
          </button>
          {MOCK_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold shrink-0 transition-colors ${
                selectedCat === cat.id
                  ? "bg-brand text-surface"
                  : "border border-border bg-surface text-text hover:bg-bg"
              }`}
            >
              {cat.name} ({items.filter((i) => i.categoryId === cat.id).length})
            </button>
          ))}
        </div>
      </div>

      {/* Items Table / Card Layout */}
      {filteredItems.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={UtensilsCrossed}
            title="No dishes found"
            description="No items match your search. You can add a new dish or clear your filter."
            actionLabel="Add New Dish"
            actionIcon={Plus}
            onAction={() => setIsDrawerOpen(true)}
          />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-card border border-border bg-surface shadow-card">
          <div ref={parentRef} className="overflow-x-auto max-h-[700px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-bg/50 text-xs font-semibold uppercase tracking-wider text-muted sticky top-0 z-10 backdrop-blur-md">
                  <th className="py-3.5 px-4">Item</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price (LKR)</th>
                  <th className="py-3.5 px-4 text-center">Availability</th>
                  <th className="py-3.5 px-4 text-right">Options</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm">
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const item = filteredItems[virtualRow.index];
                  if (!item) return null;
                  return (
                    <tr key={item.id} className="hover:bg-bg/40 transition-colors">
                    {/* Item Name & Photo */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-brand-soft border border-border">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-muted">
                              Dish
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-text">{item.name}</div>
                          <div className="text-xs text-muted line-clamp-1">{item.description}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-muted text-xs font-medium">
                      {MOCK_CATEGORIES.find((c) => c.id === item.categoryId)?.name || "Main"}
                    </td>

                    {/* Inline Price Edit */}
                    <td className="py-3 px-4 font-semibold tabular-nums text-text">
                      {editingPriceId === item.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSavePrice(item.id);
                              if (e.key === "Escape") setEditingPriceId(null);
                            }}
                            autoFocus
                            className="w-24 h-9 px-2 rounded-md border border-border text-sm font-bold bg-surface"
                          />
                          <button
                            onClick={() => handleSavePrice(item.id)}
                            className="p-1.5 rounded-full bg-brand text-surface hover:bg-brand-hover"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingPriceId(item.id);
                            setTempPrice((item.priceCents / 100).toString());
                          }}
                          className="group flex items-center gap-1.5 hover:text-brand"
                          title="Click to edit price"
                        >
                          <span>{formatMoney(item.priceCents)}</span>
                          <Edit2 className="h-3 w-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </td>

                    {/* Availability Switch (1-tap sold out) */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                          item.isAvailable
                            ? "bg-success-soft text-success hover:opacity-80"
                            : "bg-danger-soft text-danger hover:opacity-80"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            item.isAvailable ? "bg-success" : "bg-danger"
                          }`}
                        />
                        {item.isAvailable ? "In Stock" : "Sold Out"}
                      </button>
                    </td>

                    {/* Modifiers Count */}
                    <td className="py-3 px-4 text-right text-xs text-muted">
                      {item.modifiers ? `${item.modifiers.length} modifiers` : "None"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Item Side Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
              className="w-full max-w-lg h-full bg-surface border-l border-border p-6 shadow-2xl overflow-y-auto flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-border/40">
                  <h3 className="text-xl font-bold tracking-tight text-text">Add New Menu Item</h3>
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      resetForm();
                    }}
                    className="p-1 rounded-full text-muted hover:text-text hover:bg-bg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleAddItem} id="add-item-form" className="py-4 space-y-4">
                  {/* Field 1: Name */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                      Dish Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="E.g. Jaffna Crab Curry"
                      className="w-full h-12 px-4 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-info text-sm"
                    />
                  </div>

                  {/* Field 2: Category */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                      Category *
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-info text-sm"
                    >
                      {MOCK_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Field 3: Selling Price (Rs.) */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                      Selling Price (Rs.) *
                    </label>
                    <input
                      type="number"
                      required
                      value={priceRupees}
                      onChange={(e) => setPriceRupees(e.target.value)}
                      placeholder="1850"
                      className="w-full h-12 px-4 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-info text-sm"
                    />
                  </div>

                  {/* Field 4: Photo with Preview */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                      Dish Photo (URL or Upload)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={photoPreview}
                        onChange={(e) => setPhotoPreview(e.target.value)}
                        placeholder="https://... photo URL"
                        className="flex-1 h-12 px-4 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-info text-sm"
                      />
                      <label className="flex h-12 px-4 items-center justify-center rounded-xl border border-border bg-surface hover:bg-bg cursor-pointer text-muted hover:text-text transition-colors">
                        <Upload className="h-4 w-4 mr-1.5" />
                        <span className="text-xs font-semibold">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setPhotoPreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </label>
                    </div>
                    {photoPreview && (
                      <div className="mt-2 h-28 w-full rounded-xl overflow-hidden border border-border">
                        <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Field 5: Target Station */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                      Target Station
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setStation("kitchen")}
                        className={`h-11 rounded-xl border font-semibold text-xs transition-colors ${
                          station === "kitchen"
                            ? "border-brand bg-brand text-surface"
                            : "border-border bg-bg text-text"
                        }`}
                      >
                        Kitchen Station
                      </button>
                      <button
                        type="button"
                        onClick={() => setStation("bar")}
                        className={`h-11 rounded-xl border font-semibold text-xs transition-colors ${
                          station === "bar"
                            ? "border-brand bg-brand text-surface"
                            : "border-border bg-bg text-text"
                        }`}
                      >
                        Bar / Drinks
                      </button>
                    </div>
                  </div>

                  {/* Field 6: Vegetarian Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-bg/50">
                    <div>
                      <span className="text-sm font-semibold text-text">Vegetarian Option</span>
                      <p className="text-xs text-muted">Tag dish as pure veg</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsVeg(!isVeg)}
                      className={`h-6 w-11 rounded-full p-1 transition-colors ${
                        isVeg ? "bg-success" : "bg-border"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full bg-white transition-transform ${
                          isVeg ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* "More options" accordion for additional fields */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowMoreOptions(!showMoreOptions)}
                      className="flex items-center justify-between w-full py-2 text-xs font-semibold uppercase tracking-wider text-muted hover:text-text"
                    >
                      <span>{showMoreOptions ? "Fewer options" : "More options (Cost, Description, Modifiers)"}</span>
                      {showMoreOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    {showMoreOptions && (
                      <div className="mt-3 space-y-4 pt-3 border-t border-border/40">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                            Cost Price (Rs.) - For Profit Reports
                          </label>
                          <input
                            type="number"
                            value={costRupees}
                            onChange={(e) => setCostRupees(e.target.value)}
                            placeholder="750"
                            className="w-full h-11 px-4 rounded-xl border border-border bg-bg text-text text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                            Menu Description
                          </label>
                          <textarea
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Detailed description of ingredients and preparation..."
                            className="w-full p-3 rounded-xl border border-border bg-bg text-text text-sm resize-none"
                          />
                        </div>

                        {/* Modifiers List */}
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                            Dish Modifiers (Addons)
                          </label>
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={modifierName}
                              onChange={(e) => setModifierName(e.target.value)}
                              placeholder="E.g. Extra Cheese"
                              className="flex-1 h-10 px-3 rounded-lg border border-border bg-bg text-xs"
                            />
                            <input
                              type="number"
                              value={modifierPrice}
                              onChange={(e) => setModifierPrice(e.target.value)}
                              placeholder="+Rs."
                              className="w-20 h-10 px-2 rounded-lg border border-border bg-bg text-xs"
                            />
                            <button
                              type="button"
                              onClick={handleAddModifier}
                              className="px-3 h-10 rounded-lg bg-brand text-surface text-xs font-semibold"
                            >
                              Add
                            </button>
                          </div>
                          {modifiers.length > 0 && (
                            <div className="space-y-1">
                              {modifiers.map((m) => (
                                <div
                                  key={m.id}
                                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-bg border border-border"
                                >
                                  <span>{m.name}</span>
                                  <span className="font-bold">+{formatMoney(m.priceDeltaCents)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              </div>

              {/* Drawer Actions */}
              <div className="pt-4 border-t border-border/40 flex gap-3">
                <BigButton
                  label="Cancel"
                  variant="secondary"
                  full
                  onClick={() => {
                    setIsDrawerOpen(false);
                    resetForm();
                  }}
                />
                <BigButton
                  label="Save Item"
                  variant="primary"
                  full
                  type="submit"
                  form="add-item-form"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default MenuManagerPage;
