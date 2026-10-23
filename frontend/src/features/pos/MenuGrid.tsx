import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Search, X, Sparkles } from "lucide-react";
import { formatMoney } from "@/lib/formatMoney";
import type { MenuItem } from "@/api/types";

interface MenuGridProps {
  items: MenuItem[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectItem: (item: MenuItem) => void;
}

export function MenuGrid({
  items,
  searchQuery,
  onSearchChange,
  onSelectItem,
}: MenuGridProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: '/' focuses search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden p-2">
      {/* Top Search Bar */}
      <div className="relative mb-3 shrink-0">
        <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-muted pointer-events-none" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search menu... (Press '/' to focus)"
          className="w-full h-12 pl-11 pr-10 rounded-full border border-border bg-surface text-base text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-info shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            className="absolute right-3.5 top-3.5 text-muted hover:text-text p-0.5"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Grid of Photo Cards */}
      <div className="flex-1 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center rounded-card border border-dashed border-border bg-surface p-6">
            <Search className="h-10 w-10 text-muted mb-2" />
            <p className="text-base font-semibold text-text">No items found</p>
            <p className="text-sm text-muted">Try a different search or category filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.08 }}
                onClick={() => onSelectItem(item)}
                className="group flex flex-col justify-between overflow-hidden rounded-card border border-border/70 bg-surface text-left shadow-card hover:border-brand/40 transition-colors"
              >
                {item.imageUrl ? (
                  <div className="relative h-28 w-full overflow-hidden bg-brand-soft">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {item.modifiers && item.modifiers.length > 0 && (
                      <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-brand/80 px-2 py-0.5 text-[11px] font-semibold text-surface backdrop-blur-md">
                        <Sparkles className="h-3 w-3" /> Options
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="h-16 w-full bg-brand-soft/50 flex items-center justify-center text-xs font-medium text-muted">
                    Ralypto Dish
                  </div>
                )}

                <div className="p-3 flex flex-col justify-between flex-1">
                  <div>
                    <h4 className="font-semibold text-base text-text line-clamp-1 leading-snug">
                      {item.name}
                    </h4>
                    <p className="mt-0.5 text-xs text-muted line-clamp-1">{item.description}</p>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-lg font-bold tabular-nums text-text">
                      {formatMoney(item.priceCents)}
                    </span>
                    {item.isVeg && (
                      <span className="text-[10px] font-semibold text-success px-1.5 py-0.5 rounded bg-success-soft">
                        VEG
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
