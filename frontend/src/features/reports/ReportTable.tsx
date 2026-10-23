import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Download, Printer } from 'lucide-react';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { BigButton } from '@/components/common/BigButton';

export interface ReportColumn<T> {
  header: string;
  accessorKey?: keyof T;
  accessor?: (row: T) => any;
  align?: 'left' | 'right' | 'center';
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

interface ReportTableProps<T> {
  title: string;
  columns: ReportColumn<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  totalsRow?: Record<string, any>;
  onRetry?: () => void;
  exportFileName?: string;
}

export function ReportTable<T extends Record<string, any>>({
  title,
  columns,
  data,
  loading = false,
  error = null,
  totalsRow,
  onRetry,
  exportFileName,
}: ReportTableProps<T>) {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

  const getCellValue = (row: T, col: ReportColumn<T>) => {
    if (col.accessor) return col.accessor(row);
    if (col.accessorKey) return row[col.accessorKey];
    return null;
  };

  const handleExportCsv = () => {
    if (!data.length) return;

    const headers = columns.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(',');
    const rows = data.map((row) =>
      columns
        .map((c) => {
          const val = getCellValue(row, c);
          const str = val !== null && val !== undefined ? String(val) : '';
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `${exportFileName || title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  // State 1: Loading Skeleton
  if (loading) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-6 space-y-4 shadow-card">
        <div className="flex justify-between items-center pb-4 border-b border-border">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // State 2: Error
  if (error) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-10 text-center shadow-card space-y-4">
        <p className="text-sm font-semibold text-rose-500">{error}</p>
        {onRetry && (
          <div className="pt-2">
            <BigButton label="Try Again" variant="secondary" onClick={onRetry} />
          </div>
        )}
      </div>
    );
  }

  // State 3: Empty State
  if (!data.length) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-card">
        <EmptyState
          title={`No data found for ${title}`}
          description="There are no transaction records matching the chosen date range."
        />
      </div>
    );
  }

  // State 4: Normal Table with Virtualization
  return (
    <div className="rounded-3xl border border-border bg-surface shadow-card overflow-hidden">
      {/* Table Actions Header */}
      <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-base text-text">{title}</h3>
          <p className="text-xs text-muted">Showing {data.length} records</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface hover:bg-bg text-text text-xs font-semibold shadow-sm transition-colors active:scale-95"
            title="Export CSV spreadsheet"
          >
            <Download className="h-3.5 w-3.5 text-muted" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface hover:bg-bg text-text text-xs font-semibold shadow-sm transition-colors active:scale-95"
            title="Print printable summary"
          >
            <Printer className="h-3.5 w-3.5 text-muted" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Virtual Table Scroll Container */}
      <div
        ref={tableContainerRef}
        className="max-h-[520px] overflow-auto scrollbar-thin"
      >
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-bg/95 backdrop-blur-sm border-b border-border">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`p-3.5 font-bold uppercase tracking-wider text-muted ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  }`}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = data[virtualRow.index];
              return (
                <tr
                  key={virtualRow.index}
                  className="border-b border-border/40 hover:bg-bg/40 transition-colors"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {columns.map((col, cIdx) => {
                    const rawVal = getCellValue(row, col);
                    const rendered = col.render ? col.render(rawVal, row) : rawVal;
                    return (
                      <td
                        key={cIdx}
                        className={`p-3.5 font-medium truncate flex-1 ${
                          col.align === 'right'
                            ? 'text-right justify-end'
                            : col.align === 'center'
                            ? 'text-center justify-center'
                            : 'text-left'
                        }`}
                        style={{ width: col.width }}
                      >
                        {rendered}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Optional Totals Footer */}
      {totalsRow && (
        <div className="bg-bg/80 border-t border-border px-4 py-3 flex items-center justify-between text-xs font-bold text-text">
          <span className="uppercase tracking-wider text-muted">Summary Totals:</span>
          <div className="flex gap-6">
            {Object.entries(totalsRow).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className="text-muted font-normal">{key}:</span>
                <span className="tabular-nums font-extrabold">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
