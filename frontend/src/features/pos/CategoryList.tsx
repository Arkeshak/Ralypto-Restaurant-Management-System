import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { Utensils, Flame, Coffee, Cake, Layers } from "lucide-react";
import type { Category } from "@/api/types";

interface CategoryListProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Utensils: <Utensils className="h-5 w-5" />,
  Flame: <Flame className="h-5 w-5" />,
  Coffee: <Coffee className="h-5 w-5" />,
  Cake: <Cake className="h-5 w-5" />,
};

export function CategoryList({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryListProps) {
  const allCategories = [
    { id: "all", name: "All Items", icon: "Layers" },
    ...categories,
  ];

  return (
    <div className="flex flex-col gap-2 p-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted px-2 mb-1">
        Categories
      </span>
      {allCategories.map((cat) => {
        const isSelected = selectedCategoryId === cat.id;
        const Icon = iconMap[cat.icon] || <Layers className="h-5 w-5" />;

        return (
          <motion.button
            key={cat.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelectCategory(cat.id)}
            className={cn(
              "flex min-h-14 items-center gap-3 rounded-card px-4 py-3 text-left font-semibold transition-colors duration-150",
              isSelected
                ? "bg-brand text-surface shadow-sm"
                : "border border-border/40 bg-surface text-text hover:bg-bg"
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                isSelected ? "bg-surface/10 text-surface" : "bg-brand-soft text-brand"
              )}
            >
              {Icon}
            </div>
            <span className="truncate text-base">{cat.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
