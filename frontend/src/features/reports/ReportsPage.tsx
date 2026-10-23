import { useState } from "react";
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
} from "recharts";
import {
  TrendingUp,
  Sparkles,
  Lock,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { formatMoney } from "@/lib/formatMoney";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const hourlySalesData = [
  { hour: "11 AM", sales: 14500 },
  { hour: "12 PM", sales: 42000 },
  { hour: "1 PM", sales: 68500 },
  { hour: "2 PM", sales: 38000 },
  { hour: "3 PM", sales: 18000 },
  { hour: "4 PM", sales: 12000 },
  { hour: "5 PM", sales: 25000 },
  { hour: "6 PM", sales: 55000 },
  { hour: "7 PM", sales: 92000 },
  { hour: "8 PM", sales: 110000 },
  { hour: "9 PM", sales: 84000 },
  { hour: "10 PM", sales: 32000 },
];

const weeklySalesData = [
  { day: "Mon", sales: 340000 },
  { day: "Tue", sales: 410000 },
  { day: "Wed", sales: 390000 },
  { day: "Thu", sales: 480000 },
  { day: "Fri", sales: 620000 },
  { day: "Sat", sales: 780000 },
  { day: "Sun", sales: 690000 },
];

const top5Items = [
  { name: "Chicken Kottu", count: 86, revenueCents: 12470000 },
  { name: "Special Cheese Kottu", count: 64, revenueCents: 11840000 },
  { name: "Hot Butter Cuttlefish (HBC)", count: 52, revenueCents: 11440000 },
  { name: "Seafood Fried Rice", count: 48, revenueCents: 7680000 },
  { name: "Fresh Lime Juice", count: 72, revenueCents: 3240000 },
];

const presets = ["Today", "Yesterday", "This Week", "This Month"] as const;

export function ReportsPage() {
  const [selectedPreset, setSelectedPreset] = useState<string>("Today");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const { plan } = useAuth();
  const navigate = useNavigate();

  const isPremium = plan?.code === "premium";

  const handleAskAi = (question: string) => {
    if (!isPremium) {
      toast.info("AI Insights is available on the Premium Plan.");
      navigate("/upgrade?feature=ai_assistant");
      return;
    }

    if (question.includes("busiest")) {
      setAiAnswer(
        "Based on your last 30 days, your peak rush is between 7:30 PM - 9:00 PM on Friday and Saturday. Dinner table turnover averages 42 minutes."
      );
    } else if (question.includes("margin")) {
      setAiAnswer(
        "Your highest gross-margin dish is Hot Butter Cuttlefish (55.4% margin, LKR 1,220 profit per order), followed by Chicken Kottu (57.2% margin)."
      );
    } else {
      setAiAnswer(
        "Forecast indicates a 22% weekend surge due to local holiday festivities. Prepare 30% additional godamba roti dough and cuttlefish stock."
      );
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header with Presets */}
      <PageHeader
        title="Dashboard"
        description="Daily sales metrics, peak volume hours, and top-selling dishes."
      >
        <div className="flex rounded-full border border-border bg-surface p-1 shadow-sm">
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => setSelectedPreset(preset)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedPreset === preset
                  ? "bg-brand text-surface"
                  : "text-muted hover:text-text"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </PageHeader>

      {/* Top Row: 4 Big Number Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Card 1: Today Sales */}
        <div className="rounded-card border border-border bg-surface p-5 shadow-card flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            {selectedPreset} Sales
          </span>
          <div className="mt-3 text-3xl font-extrabold tracking-tight tabular-nums text-text">
            {formatMoney(59100000)}
          </div>
          <span className="mt-2 text-xs font-semibold text-success flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> +14.2% vs last week
          </span>
        </div>

        {/* Card 2: Orders */}
        <div className="rounded-card border border-border bg-surface p-5 shadow-card flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Total Orders
          </span>
          <div className="mt-3 text-3xl font-extrabold tracking-tight tabular-nums text-text">
            184
          </div>
          <span className="mt-2 text-xs font-medium text-muted">
            Avg. 15.3 orders / hour
          </span>
        </div>

        {/* Card 3: Average Bill */}
        <div className="rounded-card border border-border bg-surface p-5 shadow-card flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Average Bill
          </span>
          <div className="mt-3 text-3xl font-extrabold tracking-tight tabular-nums text-text">
            {formatMoney(321200)}
          </div>
          <span className="mt-2 text-xs font-semibold text-success flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> +5.8% ticket size
          </span>
        </div>

        {/* Card 4: Cash vs Card */}
        <div className="rounded-card border border-border bg-surface p-5 shadow-card flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Cash vs Card
          </span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold tabular-nums text-text">46%</span>
            <span className="text-xs text-muted">/</span>
            <span className="text-2xl font-bold tabular-nums text-text">54%</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted">
            <span>Cash: {formatMoney(27186000)}</span>
            <span>Card: {formatMoney(31914000)}</span>
          </div>
        </div>
      </div>

      {/* Ask AI Hospitality Card */}
      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="flex items-center justify-between pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-surface">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-text">Ask AI Hospitality Advisor</h3>
              <p className="text-xs text-muted">Instant insights powered by Gemini AI</p>
            </div>
          </div>
          {!isPremium && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold rounded-full bg-brand-soft px-2.5 py-1 text-muted">
              <Lock className="h-3.5 w-3.5" /> Premium Plan
            </span>
          )}
        </div>

        {/* Chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            "When was our busiest hour today?",
            "What is our highest margin dish?",
            "Predict tomorrow's weekend food inventory",
          ].map((q) => (
            <button
              key={q}
              onClick={() => handleAskAi(q)}
              className="rounded-full border border-border bg-bg px-4 py-2 text-xs font-medium text-text hover:border-brand transition-colors text-left"
            >
              "{q}"
            </button>
          ))}
        </div>

        {aiAnswer && (
          <div className="mt-4 rounded-xl bg-brand-soft/60 border border-brand/20 p-4 text-sm text-text leading-relaxed">
            <p className="font-semibold mb-1 text-xs uppercase tracking-wider text-muted">AI Response</p>
            {aiAnswer}
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: Sales by Hour (Bar) */}
        <div className="rounded-card border border-border bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between pb-4 border-b border-border/40 mb-4">
            <div>
              <h3 className="font-semibold text-base text-text">Sales by Hour</h3>
              <p className="text-xs text-muted">Customer volume throughout the day</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlySalesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="hour" stroke="#6e6e73" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#6e6e73"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `Rs.${v / 1000}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`Rs. ${Number(val || 0).toLocaleString()}`, "Sales"]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #d2d2d7",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="sales" fill="#1d1d1f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Last 7 Days Sales (Line) */}
        <div className="rounded-card border border-border bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between pb-4 border-b border-border/40 mb-4">
            <div>
              <h3 className="font-semibold text-base text-text">Last 7 Days Revenue</h3>
              <p className="text-xs text-muted">Weekly performance trend</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklySalesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5ea" />
                <XAxis dataKey="day" stroke="#6e6e73" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#6e6e73"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `Rs.${v / 1000}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`Rs. ${Number(val || 0).toLocaleString()}`, "Revenue"]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #d2d2d7",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#1d1d1f"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#1d1d1f" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top 5 Items List */}
      <div className="rounded-card border border-border bg-surface p-5 shadow-card">
        <h3 className="font-semibold text-base text-text mb-1">Top 5 Best-Selling Dishes</h3>
        <p className="text-xs text-muted mb-4">Ranked by total quantity and revenue</p>

        <div className="divide-y divide-border/60">
          {top5Items.map((item, idx) => (
            <div key={item.name} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-text">
                  #{idx + 1}
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-text">{item.name}</h4>
                  <span className="text-xs text-muted">{item.count} orders served</span>
                </div>
              </div>
              <span className="text-sm font-bold tabular-nums text-text">
                {formatMoney(item.revenueCents)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default ReportsPage;
