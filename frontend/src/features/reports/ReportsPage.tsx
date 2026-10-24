import { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import {
  Search,
  ArrowLeft,
  Lock,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { formatMoney } from '@/lib/formatMoney';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ReportTable, type ReportColumn } from './ReportTable';
import { REPORTS_REGISTRY, MOCK_REPORTS_DATA, type ReportMeta } from './reportsData';
import { reportsApi } from '@/api/endpoints/reports';

const EMPTY_REPORT_DATA = Object.fromEntries(
  Object.keys(MOCK_REPORTS_DATA).map((key) => [key, []]),
) as unknown as typeof MOCK_REPORTS_DATA;

function reportDates(preset: string) {
  const today = new Date();
  const end = new Date(today);
  const start = new Date(today);
  if (preset === 'Yesterday') {
    start.setDate(start.getDate() - 1);
    end.setDate(end.getDate() - 1);
  } else if (preset === 'Last 7 Days') {
    start.setDate(start.getDate() - 6);
  } else if (preset === 'This Month') {
    start.setDate(1);
  }
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
}

const PRESETS = ['Today', 'Yesterday', 'Last 7 Days', 'This Month'] as const;

export function ReportsPage() {
  const { plan } = useAuth();
  const navigate = useNavigate();

  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('Today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [reportData, setReportData] = useState(EMPTY_REPORT_DATA);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    reportsApi.getAnalytics(reportDates(selectedPreset))
      .then((data) => { if (active) setReportData(data as typeof MOCK_REPORTS_DATA); })
      .catch((error: any) => { if (active) setAnalyticsError(error?.message || 'Failed to load live reports.'); })
      .finally(() => { if (active) setAnalyticsLoading(false); });
    return () => { active = false; };
  }, [selectedPreset]);

  const isBasic = plan?.code === 'basic';

  const activeReport = useMemo(() => {
    return REPORTS_REGISTRY.find((r) => r.id === activeReportId) || null;
  }, [activeReportId]);

  // Filter report cards in hub
  const filteredReports = useMemo(() => {
    return REPORTS_REGISTRY.filter((r) => {
      const matchGroup = selectedGroup === 'all' || r.category === selectedGroup;
      const matchSearch =
        !searchQuery ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchGroup && matchSearch;
    });
  }, [selectedGroup, searchQuery]);

  const handleSelectReport = (report: ReportMeta) => {
    if (isBasic && report.minPlan !== 'basic') {
      toast.info(`The "${report.title}" is available on the Standard and Premium plans.`);
      navigate(`/upgrade?feature=advanced_reports`);
      return;
    }
    setActiveReportId(report.id);
  };

  // Build columns & totals for the active report
  const reportViewConfig = useMemo(() => {
    if (!activeReport) return null;

    switch (activeReport.id) {
      case 'daily_sales': {
        const data = reportData.daily_sales;
        const columns: ReportColumn<any>[] = [
          { header: 'Date', accessorKey: 'date' },
          { header: 'Orders', accessorKey: 'orders', align: 'center' },
          {
            header: 'Gross Sales',
            accessorKey: 'grossCents',
            align: 'right',
            render: (v) => formatMoney(v),
          },
          {
            header: 'Discounts',
            accessorKey: 'discountCents',
            align: 'right',
            render: (v) => `-${formatMoney(v)}`,
          },
          {
            header: 'Service (10%)',
            accessorKey: 'serviceCents',
            align: 'right',
            render: (v) => formatMoney(v),
          },
          {
            header: 'Govt Tax (10%)',
            accessorKey: 'taxCents',
            align: 'right',
            render: (v) => formatMoney(v),
          },
          {
            header: 'Net Billed',
            accessorKey: 'netCents',
            align: 'right',
            render: (v) => <span className="font-bold">{formatMoney(v)}</span>,
          },
        ];
        const totalNet = data.reduce((acc, row) => acc + row.netCents, 0);
        const totalOrders = data.reduce((acc, row) => acc + row.orders, 0);
        return {
          data,
          columns,
          totalsRow: { 'Total Orders': totalOrders, 'Net Total': formatMoney(totalNet) },
        };
      }

      case 'sales_by_hour': {
        const data = reportData.sales_by_hour;
        const columns: ReportColumn<any>[] = [
          { header: 'Hour Range', accessorKey: 'hour' },
          { header: 'Orders Placed', accessorKey: 'orders', align: 'center' },
          {
            header: 'Total Sales',
            accessorKey: 'totalCents',
            align: 'right',
            render: (v) => <span className="font-bold">{formatMoney(v)}</span>,
          },
          {
            header: 'Avg Ticket Size',
            accessorKey: 'avgCents',
            align: 'right',
            render: (v) => formatMoney(v),
          },
        ];
        const totalSales = data.reduce((acc, row) => acc + row.totalCents, 0);
        return {
          data,
          columns,
          totalsRow: { 'Period Revenue': formatMoney(totalSales) },
        };
      }

      case 'sales_by_item': {
        const data = reportData.sales_by_item;
        const columns: ReportColumn<any>[] = [
          { header: 'Dish Name', accessorKey: 'name' },
          { header: 'Category', accessorKey: 'category' },
          { header: 'Units Sold', accessorKey: 'units', align: 'center' },
          {
            header: 'Unit Price',
            accessorKey: 'priceCents',
            align: 'right',
            render: (v) => formatMoney(v),
          },
          {
            header: 'Revenue',
            accessorKey: 'totalCents',
            align: 'right',
            render: (v) => <span className="font-bold">{formatMoney(v)}</span>,
          },
        ];
        const totalUnits = data.reduce((acc, row) => acc + row.units, 0);
        const totalRev = data.reduce((acc, row) => acc + row.totalCents, 0);
        return {
          data,
          columns,
          totalsRow: { 'Total Units': totalUnits, 'Product Revenue': formatMoney(totalRev) },
        };
      }

      case 'sales_by_category': {
        const data = reportData.sales_by_category;
        const columns: ReportColumn<any>[] = [
          { header: 'Menu Category', accessorKey: 'category' },
          { header: 'Menu Items', accessorKey: 'itemsCount', align: 'center' },
          { header: 'Portions Sold', accessorKey: 'unitsSold', align: 'center' },
          {
            header: 'Category Sales',
            accessorKey: 'totalCents',
            align: 'right',
            render: (v) => <span className="font-bold">{formatMoney(v)}</span>,
          },
          { header: '% Revenue Share', accessorKey: 'sharePercent', align: 'right' },
        ];
        const totalRev = data.reduce((acc, row) => acc + row.totalCents, 0);
        return {
          data,
          columns,
          totalsRow: { 'Total Category Sales': formatMoney(totalRev) },
        };
      }

      case 'sales_by_staff': {
        const data = reportData.sales_by_staff;
        const columns: ReportColumn<any>[] = [
          { header: 'Employee Name', accessorKey: 'staff' },
          { header: 'Role', accessorKey: 'role' },
          { header: 'Orders Processed', accessorKey: 'orders', align: 'center' },
          {
            header: 'Total Sales Generated',
            accessorKey: 'totalCents',
            align: 'right',
            render: (v) => <span className="font-bold">{formatMoney(v)}</span>,
          },
          {
            header: 'Average Order Size',
            accessorKey: 'avgTicketCents',
            align: 'right',
            render: (v) => formatMoney(v),
          },
        ];
        const totalRev = data.reduce((acc, row) => acc + row.totalCents, 0);
        return {
          data,
          columns,
          totalsRow: { 'Staff Total': formatMoney(totalRev) },
        };
      }

      case 'sales_by_table': {
        const data = reportData.sales_by_table;
        const columns: ReportColumn<any>[] = [
          { header: 'Table', accessorKey: 'table' },
          { header: 'Dining Area', accessorKey: 'area' },
          { header: 'Order Turns', accessorKey: 'orders', align: 'center' },
          { header: 'Guests Seated', accessorKey: 'guests', align: 'center' },
          {
            header: 'Table Sales',
            accessorKey: 'totalCents',
            align: 'right',
            render: (v) => <span className="font-bold">{formatMoney(v)}</span>,
          },
          {
            header: 'Avg Turn Time',
            accessorKey: 'avgTurnMinutes',
            align: 'right',
            render: (v) => `${v} mins`,
          },
        ];
        const totalRev = data.reduce((acc, row) => acc + row.totalCents, 0);
        return {
          data,
          columns,
          totalsRow: { 'Total Table Revenue': formatMoney(totalRev) },
        };
      }

      case 'payment_methods': {
        const data = reportData.payment_methods;
        const columns: ReportColumn<any>[] = [
          { header: 'Payment Tender', accessorKey: 'method' },
          { header: 'Transaction Count', accessorKey: 'count', align: 'center' },
          {
            header: 'Total Collected',
            accessorKey: 'totalCents',
            align: 'right',
            render: (v) => <span className="font-bold">{formatMoney(v)}</span>,
          },
          { header: '% Share', accessorKey: 'sharePercent', align: 'right' },
        ];
        const totalRev = data.reduce((acc, row) => acc + row.totalCents, 0);
        return {
          data,
          columns,
          totalsRow: { 'Total Tender': formatMoney(totalRev) },
        };
      }

      case 'tax_service_summary': {
        const data = reportData.tax_service_summary;
        const columns: ReportColumn<any>[] = [
          { header: 'Date', accessorKey: 'date' },
          {
            header: 'Food & Beverage Subtotal',
            accessorKey: 'netSalesCents',
            align: 'right',
            render: (v) => formatMoney(v),
          },
          {
            header: 'Service Charge (10%)',
            accessorKey: 'serviceCents',
            align: 'right',
            render: (v) => formatMoney(v),
          },
          {
            header: 'Govt VAT / Tax (10%)',
            accessorKey: 'taxCents',
            align: 'right',
            render: (v) => formatMoney(v),
          },
          {
            header: 'Total Billed',
            accessorKey: 'totalCents',
            align: 'right',
            render: (v) => <span className="font-bold">{formatMoney(v)}</span>,
          },
        ];
        const totalTax = data.reduce((acc, row) => acc + row.taxCents, 0);
        const totalService = data.reduce((acc, row) => acc + row.serviceCents, 0);
        return {
          data,
          columns,
          totalsRow: {
            'Total Tax': formatMoney(totalTax),
            'Total Service': formatMoney(totalService),
          },
        };
      }

      case 'discounts_given': {
        const data = reportData.discounts_given;
        const columns: ReportColumn<any>[] = [
          { header: 'Order Ref', accessorKey: 'orderId' },
          { header: 'Time', accessorKey: 'time' },
          { header: 'Discount Scheme', accessorKey: 'type' },
          { header: 'Approved Reason', accessorKey: 'reason' },
          { header: 'Authorized Manager', accessorKey: 'authorizedBy' },
          {
            header: 'Discount Amount',
            accessorKey: 'amountCents',
            align: 'right',
            render: (v) => <span className="font-bold text-emerald-600">-{formatMoney(v)}</span>,
          },
        ];
        const totalDiscount = data.reduce((acc, row) => acc + row.amountCents, 0);
        return {
          data,
          columns,
          totalsRow: { 'Discounts Given': formatMoney(totalDiscount) },
        };
      }

      case 'voids_refunds': {
        const data = reportData.voids_refunds;
        const columns: ReportColumn<any>[] = [
          { header: 'Order Ref', accessorKey: 'orderId' },
          { header: 'Time', accessorKey: 'time' },
          { header: 'Voided Dishes', accessorKey: 'items' },
          { header: 'Void Reason', accessorKey: 'reason' },
          { header: 'Approving PIN', accessorKey: 'authorizedBy' },
          { header: 'Terminal Cashier', accessorKey: 'cashier' },
          {
            header: 'Void Value',
            accessorKey: 'amountCents',
            align: 'right',
            render: (v) => <span className="font-bold text-rose-500">{formatMoney(v)}</span>,
          },
        ];
        const totalVoid = data.reduce((acc, row) => acc + row.amountCents, 0);
        return {
          data,
          columns,
          totalsRow: { 'Total Voids / Refunds': formatMoney(totalVoid) },
        };
      }

      case 'shift_summary': {
        const data = reportData.shift_summary;
        const columns: ReportColumn<any>[] = [
          { header: 'Shift ID', accessorKey: 'shiftId' },
          { header: 'Cashier', accessorKey: 'cashier' },
          { header: 'Opened At', accessorKey: 'opened' },
          { header: 'Closed At', accessorKey: 'closed' },
          {
            header: 'Opening Float',
            accessorKey: 'floatCents',
            align: 'right',
            render: (v) => formatMoney(v),
          },
          {
            header: 'Expected Cash',
            accessorKey: 'expectedCashCents',
            align: 'right',
            render: (v) => formatMoney(v),
          },
          {
            header: 'Counted Cash',
            accessorKey: 'countedCashCents',
            align: 'right',
            render: (v) => formatMoney(v),
          },
          {
            header: 'Variance',
            accessorKey: 'varianceCents',
            align: 'right',
            render: (v) => (
              <span
                className={`font-bold ${
                  v === 0 ? 'text-emerald-600' : 'text-rose-500'
                }`}
              >
                {formatMoney(v)}
              </span>
            ),
          },
        ];
        return { data, columns };
      }

      case 'top_bottom_items': {
        const data = reportData.top_bottom_items;
        const columns: ReportColumn<any>[] = [
          { header: 'Rank / Tier', accessorKey: 'rank' },
          { header: 'Dish Name', accessorKey: 'name' },
          { header: 'Category', accessorKey: 'category' },
          { header: 'Portions Sold', accessorKey: 'unitsSold', align: 'center' },
          {
            header: 'Gross Revenue',
            accessorKey: 'totalRevenueCents',
            align: 'right',
            render: (v) => <span className="font-bold">{formatMoney(v)}</span>,
          },
          { header: 'Profit Margin', accessorKey: 'margin', align: 'right' },
        ];
        return { data, columns };
      }

      default:
        return null;
    }
  }, [activeReport, reportData]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* View 1: Reports Center Hub */}
      {!activeReport ? (
        <>
          <PageHeader
            title="Reports Center"
            description="Audited financial summaries, product velocity, and staff performance metrics."
          >
            {isBasic && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 text-xs font-bold">
                <span>Basic Plan: 10 of 12 Reports Active</span>
              </div>
            )}
          </PageHeader>

          {/* Search & Category Filter Pills */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reports by keyword (sales, tax, shifts...)"
                className="w-full h-11 pl-10 pr-4 rounded-full border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-info shadow-sm"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: 'All Reports' },
                { id: 'sales', label: 'Sales' },
                { id: 'items', label: 'Items & Menu' },
                { id: 'staff', label: 'Staff & Shifts' },
                { id: 'money', label: 'Money & Tax' },
              ].map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroup(group.id)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold shrink-0 transition-colors ${
                    selectedGroup === group.id
                      ? 'bg-brand text-surface'
                      : 'border border-border bg-surface text-text hover:bg-bg'
                  }`}
                >
                  {group.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((report) => {
              const isLocked = isBasic && report.minPlan !== 'basic';
              return (
                <div
                  key={report.id}
                  onClick={() => handleSelectReport(report)}
                  className={`group relative rounded-3xl border border-border bg-surface p-6 shadow-card hover:border-brand/40 transition-all cursor-pointer flex flex-col justify-between ${
                    isLocked ? 'opacity-80' : ''
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-bg text-muted border border-border/60">
                        {report.category}
                      </span>
                      {isLocked ? (
                        <div className="flex items-center gap-1 text-xs font-semibold text-muted bg-bg px-2 py-0.5 rounded-full border">
                          <Lock className="h-3 w-3" />
                          <span>Standard</span>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-brand opacity-0 group-hover:opacity-100 transition-opacity">
                          Open Report →
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-text group-hover:text-brand transition-colors">
                        {report.title}
                      </h3>
                      <p className="text-xs text-muted mt-1 leading-relaxed">
                        {report.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border/40 flex items-center justify-between text-[11px] text-muted">
                    <span>Export CSV & Print</span>
                    {report.hasChart && (
                      <span className="flex items-center gap-1 text-text font-semibold">
                        <TrendingUp className="h-3 w-3 text-brand" />
                        <span>Interactive Chart</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Coming Soon in Phase 3: Stock Depletion Card */}
            <div className="rounded-3xl border border-dashed border-border bg-bg/40 p-6 flex flex-col justify-between opacity-60">
              <div className="space-y-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-bg text-muted border border-border/60">
                  Stock
                </span>
                <div>
                  <h3 className="font-bold text-base text-text">Stock & GRN Depletion</h3>
                  <p className="text-xs text-muted mt-1">
                    Ingredient level variance, recipe depletion, and supplier purchase orders.
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-muted mt-4">Coming in Phase 3</span>
            </div>
          </div>
        </>
      ) : (
        /* View 2: Detailed Report View with Presets, Chart, and Table */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveReportId(null)}
                className="h-10 w-10 rounded-full border border-border bg-surface hover:bg-bg flex items-center justify-center text-text transition-colors"
                title="Back to Reports Center"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-text">
                  {activeReport.title}
                </h2>
                <p className="text-xs text-muted">{activeReport.description}</p>
              </div>
            </div>

            {/* Date Range Presets */}
            <div className="flex rounded-full border border-border bg-surface p-1 shadow-sm shrink-0">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setSelectedPreset(preset)}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
                    selectedPreset === preset
                      ? 'bg-brand text-surface'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Mini Chart where appropriate */}
          {activeReport.hasChart && (
            <div className="rounded-3xl border border-border bg-surface p-6 shadow-card">
              <h4 className="font-bold text-xs uppercase tracking-wider text-muted mb-4">
                Trend Analysis ({selectedPreset})
              </h4>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {activeReport.id === 'sales_by_hour' ? (
                    <BarChart data={reportData.sales_by_hour}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                      <XAxis dataKey="hour" fontSize={11} stroke="#888" tickLine={false} />
                      <YAxis
                        fontSize={11}
                        stroke="#888"
                        tickLine={false}
                        tickFormatter={(v) => `Rs.${v / 100000}k`}
                      />
                      <Tooltip
                        formatter={(val: any) => [formatMoney(val), 'Hourly Sales']}
                        contentStyle={{
                          backgroundColor: '#18181b',
                          borderColor: '#27272a',
                          borderRadius: '12px',
                          color: '#fff',
                        }}
                      />
                      <Bar dataKey="totalCents" fill="#18181b" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  ) : activeReport.id === 'daily_sales' ? (
                    <LineChart data={reportData.daily_sales}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                      <XAxis dataKey="date" fontSize={10} stroke="#888" tickLine={false} />
                      <YAxis
                        fontSize={11}
                        stroke="#888"
                        tickLine={false}
                        tickFormatter={(v) => `Rs.${v / 100000}k`}
                      />
                      <Tooltip
                        formatter={(val: any) => [formatMoney(val), 'Net Sales']}
                        contentStyle={{
                          backgroundColor: '#18181b',
                          borderColor: '#27272a',
                          borderRadius: '12px',
                          color: '#fff',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="netCents"
                        stroke="#18181b"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  ) : activeReport.id === 'sales_by_category' ? (
                    <BarChart data={reportData.sales_by_category}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                      <XAxis dataKey="category" fontSize={11} stroke="#888" tickLine={false} />
                      <YAxis
                        fontSize={11}
                        stroke="#888"
                        tickLine={false}
                        tickFormatter={(v) => `Rs.${v / 100000}k`}
                      />
                      <Tooltip
                        formatter={(val: any) => [formatMoney(val), 'Category Sales']}
                        contentStyle={{
                          backgroundColor: '#18181b',
                          borderColor: '#27272a',
                          borderRadius: '12px',
                          color: '#fff',
                        }}
                      />
                      <Bar dataKey="totalCents" fill="#18181b" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  ) : (
                    <BarChart data={reportData.payment_methods}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                      <XAxis dataKey="method" fontSize={11} stroke="#888" tickLine={false} />
                      <YAxis
                        fontSize={11}
                        stroke="#888"
                        tickLine={false}
                        tickFormatter={(v) => `Rs.${v / 100000}k`}
                      />
                      <Tooltip
                        formatter={(val: any) => [formatMoney(val), 'Tender Collected']}
                        contentStyle={{
                          backgroundColor: '#18181b',
                          borderColor: '#27272a',
                          borderRadius: '12px',
                          color: '#fff',
                        }}
                      />
                      <Bar dataKey="totalCents" fill="#18181b" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Virtualized Report Table */}
          {reportViewConfig && (
            analyticsLoading ? (
              <div className="rounded-3xl border border-border bg-surface p-8 text-center text-sm text-muted">Loading live report data…</div>
            ) : analyticsError ? (
              <div className="rounded-3xl border border-border bg-surface p-8 text-center text-sm text-danger">{analyticsError}</div>
            ) : (
            <ReportTable
              title={`${activeReport.title} (${selectedPreset})`}
              columns={reportViewConfig.columns}
              data={reportViewConfig.data}
              totalsRow={reportViewConfig.totalsRow}
              exportFileName={`ralypto_${activeReport.id}_${selectedPreset.toLowerCase().replace(/\s+/g, '_')}`}
            />
            )
          )}
        </div>
      )}
    </div>
  );
}

export default ReportsPage;
