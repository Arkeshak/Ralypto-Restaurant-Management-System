import { motion } from "framer-motion";
import { Users, MoreVertical, ArrowRightLeft, GitMerge, FileText } from "lucide-react";
import { useState } from "react";
import { StatusPill, type Tone } from "@/components/common/StatusPill";
import { formatMoney } from "@/lib/formatMoney";
import { cn } from "@/lib/cn";

export type TableStatus = "free" | "busy" | "bill_requested";

export type TableInfo = {
  id: string;
  number: number;
  seats: number;
  status: TableStatus;
  totalCents?: number;
  minutesOpen?: number;
  area?: string;
};

const statusView: Record<TableStatus, { tone: Tone; label: string; border: string }> = {
  free: { tone: "free", label: "Free", border: "border-success/30 hover:border-success/60" },
  busy: { tone: "busy", label: "Busy", border: "border-busy/40 hover:border-busy/70" },
  bill_requested: { tone: "waiting", label: "Bill requested", border: "border-warning/50 hover:border-warning/80" },
};

interface TableCardProps {
  table: TableInfo;
  onOpen: (t: TableInfo) => void;
  onMove?: (t: TableInfo) => void;
  onMerge?: (t: TableInfo) => void;
  onRequestBill?: (t: TableInfo) => void;
}

export function TableCard({ table, onOpen, onMove, onMerge, onRequestBill }: TableCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const view = statusView[table.status];

  return (
    <div className="relative group">
      <motion.button
        layout
        whileTap={{ scale: 0.97 }}
        onClick={() => onOpen(table)}
        className={cn(
          "w-full flex min-h-[148px] flex-col items-start justify-between rounded-card border bg-surface p-4 text-left shadow-card transition-all duration-150",
          view.border
        )}
      >
        <div className="flex w-full items-start justify-between">
          <span className="text-3xl font-bold tracking-tight text-text">T{table.number}</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-sm text-muted">
              <Users className="h-4 w-4" aria-hidden /> {table.seats}
            </span>
            <button
              type="button"
              aria-label="Table options"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 rounded-full text-muted hover:text-text hover:bg-bg transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mt-3 w-full">
          <div className="flex items-center justify-between">
            <StatusPill tone={view.tone} label={view.label} />
          </div>
          {table.status !== "free" && (
            <span className="text-sm font-semibold tabular-nums text-muted">
              {formatMoney(table.totalCents ?? 0)} · {table.minutesOpen ?? 0} min
            </span>
          )}
        </div>
      </motion.button>

      {/* Table Context Menu */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute right-2 top-10 z-40 w-48 rounded-2xl border border-border bg-surface p-1.5 shadow-xl backdrop-blur-xl"
          >
            <button
              onClick={() => {
                setShowMenu(false);
                onMove?.(table);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-text hover:bg-bg transition-colors"
            >
              <ArrowRightLeft className="h-4 w-4 text-muted" /> Move Table
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                onMerge?.(table);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-text hover:bg-bg transition-colors"
            >
              <GitMerge className="h-4 w-4 text-muted" /> Merge Table
            </button>
            {table.status === "busy" && (
              <button
                onClick={() => {
                  setShowMenu(false);
                  onRequestBill?.(table);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-text hover:bg-bg transition-colors"
              >
                <FileText className="h-4 w-4 text-muted" /> Request Bill
              </button>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
