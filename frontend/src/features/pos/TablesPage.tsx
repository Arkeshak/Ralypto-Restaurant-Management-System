import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LayoutGrid, Plus, RefreshCw, AlertCircle } from "lucide-react";
import { TableCard, type TableInfo, type TableStatus } from "./TableCard";
import { PageHeader } from "@/components/common/PageHeader";
import { TableCardSkeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { BigButton } from "@/components/common/BigButton";

import { tablesApi } from "@/api/endpoints/tables";
import { formatMoney } from "@/lib/formatMoney";
import { useReadOnly } from "@/hooks/useReadOnly";

const initialTables: TableInfo[] = [
  { id: "1", number: 1, seats: 2, status: "free", area: "Inside" },
  { id: "2", number: 2, seats: 4, status: "busy", totalCents: 245000, minutesOpen: 18, area: "Inside" },
  { id: "3", number: 3, seats: 6, status: "bill_requested", totalCents: 612500, minutesOpen: 52, area: "Inside" },
  { id: "4", number: 4, seats: 4, status: "free", area: "Inside" },
  { id: "5", number: 5, seats: 4, status: "busy", totalCents: 128000, minutesOpen: 7, area: "Inside" },
  { id: "6", number: 6, seats: 2, status: "free", area: "Outside" },
  { id: "7", number: 7, seats: 4, status: "busy", totalCents: 389000, minutesOpen: 29, area: "Outside" },
  { id: "8", number: 8, seats: 8, status: "free", area: "Outside" },
  { id: "9", number: 9, seats: 4, status: "busy", totalCents: 540000, minutesOpen: 41, area: "Rooftop" },
  { id: "10", number: 10, seats: 2, status: "free", area: "Rooftop" },
  { id: "11", number: 11, seats: 4, status: "free", area: "Rooftop" },
  { id: "12", number: 12, seats: 6, status: "bill_requested", totalCents: 780000, minutesOpen: 63, area: "Rooftop" },
];

const areas = ["All", "Inside", "Outside", "Rooftop"] as const;

const statusFilters: { key: "all" | TableStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "free", label: "Free" },
  { key: "busy", label: "Busy" },
  { key: "bill_requested", label: "Bill requested" },
];

export default function TablesPage() {
  const navigate = useNavigate();
  const { isReadOnly, preventInReadOnly } = useReadOnly();
  const [tables, setTables] = useState<TableInfo[]>(initialTables);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<"all" | TableStatus>("all");

  // Dialog states for table operations
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [isMergeOpen, setIsMergeOpen] = useState(false);
  const [targetTableId, setTargetTableId] = useState<string>("");
  const [mergeManagerPin, setMergeManagerPin] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);

  // Simulated live update increments minute timers
  useEffect(() => {
    const timer = setInterval(() => {
      setTables((prev) =>
        prev.map((t) =>
          t.status !== "free" && t.minutesOpen !== undefined
            ? { ...t, minutesOpen: t.minutesOpen + 1 }
            : t
        )
      );
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleOpenTable = (table: TableInfo) => {
    navigate(`/billing?table=${table.id}&number=${table.number}`);
  };

  const handleRequestBill = (table: TableInfo) => {
    setTables((prev) =>
      prev.map((t) => (t.id === table.id ? { ...t, status: "bill_requested" } : t))
    );
    toast.success(`Bill requested for Table T${table.number}`);
  };

  const handleMoveConfirm = async () => {
    if (isReadOnly) {
      toast.error('Action blocked: Your account is in Read-Only mode. Please renew your plan.');
      return;
    }
    if (!selectedTable || !targetTableId) return;
    const target = tables.find((t) => t.id === targetTableId);
    if (!target) return;

    setActionLoading(true);
    try {
      await tablesApi.moveTable(selectedTable.id, targetTableId);
      setTables((prev) =>
        prev.map((t) => {
          if (t.id === selectedTable.id) {
            return { ...t, status: "free", totalCents: undefined, minutesOpen: undefined };
          }
          if (t.id === targetTableId) {
            return {
              ...t,
              status: selectedTable.status,
              totalCents: selectedTable.totalCents,
              minutesOpen: selectedTable.minutesOpen,
            };
          }
          return t;
        })
      );
      toast.success(`Moved order from T${selectedTable.number} to T${target.number}`);
      setIsMoveOpen(false);
      setSelectedTable(null);
      setTargetTableId("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to move table");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMergeConfirm = async () => {
    if (isReadOnly) {
      toast.error('Action blocked: Your account is in Read-Only mode. Please renew your plan.');
      return;
    }
    if (!selectedTable || !targetTableId) return;
    const target = tables.find((t) => t.id === targetTableId);
    if (!target) return;

    setActionLoading(true);
    try {
      await tablesApi.mergeTable(selectedTable.id, targetTableId, mergeManagerPin || undefined);
      const mergedTotal = (selectedTable.totalCents ?? 0) + (target.totalCents ?? 0);
      setTables((prev) =>
        prev.map((t) => {
          if (t.id === selectedTable.id) {
            return { ...t, status: "free", totalCents: undefined, minutesOpen: undefined };
          }
          if (t.id === targetTableId) {
            return {
              ...t,
              status: "busy",
              totalCents: mergedTotal,
              minutesOpen: Math.max(selectedTable.minutesOpen ?? 0, target.minutesOpen ?? 0),
            };
          }
          return t;
        })
      );
      toast.success(`Merged T${selectedTable.number} into T${target.number}`);
      setIsMergeOpen(false);
      setSelectedTable(null);
      setTargetTableId("");
      setMergeManagerPin("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to merge tables");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered tables
  const filteredTables = tables.filter((t) => {
    const areaMatch = selectedArea === "All" || t.area === selectedArea;
    const statusMatch = selectedStatus === "all" || t.status === selectedStatus;
    return areaMatch && statusMatch;
  });

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Tables"
        description="Tap a table to start or open an order."
        action={{
          label: "New Order",
          icon: Plus,
          onClick: preventInReadOnly(() => navigate("/billing")),
        }}
      />

      {/* Area Tabs & Status Filter Chips */}
      <div className="mt-6 flex flex-col gap-4">
        {/* Area Tabs */}
        <div className="flex border-b border-border/40 pb-2 gap-2 overflow-x-auto scrollbar-none">
          {areas.map((area) => (
            <button
              key={area}
              onClick={() => setSelectedArea(area)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                selectedArea === area
                  ? "bg-brand text-surface"
                  : "text-muted hover:text-text hover:bg-surface"
              }`}
            >
              {area} {area !== "All" && `(${tables.filter((t) => t.area === area).length})`}
            </button>
          ))}
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((f) => {
              const count = tables.filter((t) =>
                (selectedArea === "All" || t.area === selectedArea) &&
                (f.key === "all" || t.status === f.key)
              ).length;

              return (
                <button
                  key={f.key}
                  onClick={() => setSelectedStatus(f.key)}
                  className={`min-h-11 rounded-full border px-4 text-sm font-medium transition-colors ${
                    selectedStatus === f.key
                      ? "border-brand bg-brand text-surface"
                      : "border-border bg-surface text-text hover:bg-bg"
                  }`}
                >
                  {f.label} ({count})
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 400);
            }}
            title="Refresh tables"
            className="p-2 rounded-full border border-border bg-surface text-muted hover:text-text hover:bg-bg transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Screen States: Loading / Error / Empty / Normal */}
      {loading ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <TableCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="mt-8 rounded-card border border-border bg-surface p-12 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-danger" />
          <h3 className="mt-3 text-lg font-semibold text-text">Failed to load tables</h3>
          <p className="mt-1 text-sm text-muted">{error}</p>
          <div className="mt-6">
            <BigButton
              label="Try again"
              variant="secondary"
              onClick={() => {
                setError(null);
                setLoading(false);
              }}
            />
          </div>
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={LayoutGrid}
            title="No tables found"
            description="There are no tables matching the selected filters. Try switching areas or resetting the status filter."
            actionLabel="Show All Tables"
            onAction={() => {
              setSelectedArea("All");
              setSelectedStatus("all");
            }}
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredTables.map((t) => (
            <TableCard
              key={t.id}
              table={t}
              onOpen={handleOpenTable}
              onMove={(tb) => {
                setSelectedTable(tb);
                setIsMoveOpen(true);
              }}
              onMerge={(tb) => {
                setSelectedTable(tb);
                setIsMergeOpen(true);
              }}
              onRequestBill={handleRequestBill}
            />
          ))}
        </div>
      )}

      {/* Move Table Dialog */}
      {isMoveOpen && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="w-full max-w-md rounded-card border border-border bg-surface p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-text">Move Table T{selectedTable.number}</h3>
            <p className="mt-1 text-sm text-muted">Select an unoccupied table to move this order to.</p>

            <div className="mt-4 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">Target Table</label>
              <select
                value={targetTableId}
                onChange={(e) => setTargetTableId(e.target.value)}
                className="w-full h-12 rounded-lg border border-border bg-bg px-3 text-base text-text focus:outline-none focus:ring-2 focus:ring-info"
              >
                <option value="">Select a free table...</option>
                {tables
                  .filter((t) => t.status === "free" && t.id !== selectedTable.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      T{t.number} ({t.area} - {t.seats} seats)
                    </option>
                  ))}
              </select>
            </div>

            <div className="mt-6 flex gap-3">
              <BigButton
                label="Cancel"
                variant="secondary"
                full
                onClick={() => {
                  setIsMoveOpen(false);
                  setSelectedTable(null);
                }}
              />
              <BigButton
                label="Move Order"
                variant="primary"
                full
                disabled={!targetTableId || actionLoading}
                loading={actionLoading}
                onClick={handleMoveConfirm}
              />
            </div>
          </div>
        </div>
      )}

      {/* Merge Table Dialog */}
      {isMergeOpen && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="w-full max-w-md rounded-card border border-border bg-surface p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-text">Merge Table T{selectedTable.number}</h3>
            <p className="mt-1 text-sm text-muted">Combine with another active busy table.</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted">Merge Into</label>
                <select
                  value={targetTableId}
                  onChange={(e) => setTargetTableId(e.target.value)}
                  className="w-full h-12 rounded-lg border border-border bg-bg px-3 text-base text-text focus:outline-none focus:ring-2 focus:ring-info mt-1"
                >
                  <option value="">Select an active table...</option>
                  {tables
                    .filter((t) => t.status !== "free" && t.id !== selectedTable.id)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        T{t.number} ({t.area} · {formatMoney(t.totalCents || 0)})
                      </option>
                    ))}
                </select>
              </div>

              {/* Combined items and amount preview */}
              {targetTableId && (() => {
                const target = tables.find((t) => t.id === targetTableId);
                if (!target) return null;
                const combined = (selectedTable.totalCents || 0) + (target.totalCents || 0);

                return (
                  <div className="p-3.5 rounded-xl bg-bg border border-border text-xs space-y-2">
                    <p className="font-semibold text-text uppercase tracking-wider text-[11px]">Combined Order Preview</p>
                    <div className="flex justify-between text-muted">
                      <span>Source: Table T{selectedTable.number}</span>
                      <span className="font-semibold text-text">{formatMoney(selectedTable.totalCents || 0)}</span>
                    </div>
                    <div className="flex justify-between text-muted">
                      <span>Target: Table T{target.number}</span>
                      <span className="font-semibold text-text">{formatMoney(target.totalCents || 0)}</span>
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between font-bold text-sm text-text">
                      <span>New Combined Total</span>
                      <span className="text-brand">{formatMoney(combined)}</span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Manager PIN (if required)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={mergeManagerPin}
                  onChange={(e) => setMergeManagerPin(e.target.value)}
                  placeholder="••••"
                  className="w-full h-11 px-3 mt-1 rounded-lg border border-border bg-bg text-text text-sm focus:outline-none focus:ring-2 focus:ring-info font-mono"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <BigButton
                label="Cancel"
                variant="secondary"
                full
                disabled={actionLoading}
                onClick={() => {
                  setIsMergeOpen(false);
                  setSelectedTable(null);
                  setTargetTableId("");
                  setMergeManagerPin("");
                }}
              />
              <BigButton
                label="Merge Bills"
                variant="primary"
                full
                disabled={!targetTableId || actionLoading}
                loading={actionLoading}
                onClick={handleMergeConfirm}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export { TablesPage };
