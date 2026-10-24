import { useEffect, useState } from "react";
import {
  Sparkles,
  Bot,
  Send,
  Calendar,
  TrendingUp,
  AlertTriangle,
  ChefHat,
  Package,
  Copy,
  Check,
  MessageSquare,
  HelpCircle,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { MicButton } from "@/components/voice/MicButton";
import { formatMoney } from "@/lib/formatMoney";
import { toast } from "sonner";
import { apiClient } from "@/api/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChatMessage {
  id: string;
  sender: "user" | "ralypto";
  text: string;
  timestamp: string;
  chartData?: Array<{ name: string; value: number }>;
  chartLabel?: string;
}

export function AiAssistantPage() {
  const [activeTab, setActiveTab] = useState<"ask" | "briefing" | "forecast">("ask");
  const [inputQuery, setInputQuery] = useState("");
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  useEffect(() => { void apiClient<any>("/reports/analytics").then(setAnalytics).catch(() => toast.error("Could not load live analytics")); }, []);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-init",
      sender: "ralypto",
      text: "I can summarize the restaurant's recorded sales and orders. Ask a question or choose a prompt below; answers update from the connected backend data.",
      timestamp: "Just now",
    },
  ]);

  const presetQuestions = [
    "Why were sales low on Tuesday?",
    "Best selling item this week?",
    "Which items have the highest profit margin?",
    "Show tomorrow's customer demand forecast & prep list",
  ];

  const handleSendQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: queryText,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");

    try {
      const data = analytics ?? await apiClient<any>("/reports/analytics");
      setAnalytics(data);
      const q = queryText.toLowerCase(); const items = data.sales_by_item ?? []; const daily = data.daily_sales ?? [];
      let text: string;
      if (q.includes("best") || q.includes("selling") || q.includes("popular")) {
        const top = [...items].sort((a,b) => b.units-a.units)[0];
        text = top ? `${top.name} is the best seller in the available completed-order data: ${top.units} units and ${formatMoney(top.totalCents)} in recorded sales.` : "There are no completed order items in the selected data yet, so I cannot identify a best seller.";
      } else if (q.includes("margin") || q.includes("profit") || q.includes("star")) {
        const ranked = (data.top_bottom_items ?? []).filter((row:any) => Number.parseFloat(row.margin) > 0).sort((a:any,b:any) => Number.parseFloat(b.margin)-Number.parseFloat(a.margin));
        text = ranked.length ? `Highest recorded menu margin is ${ranked[0].name} at ${ranked[0].margin}. This uses the menu item's saved cost and price; it does not include overhead.` : "No cost and sales data is available to calculate a menu margin yet.";
      } else if (q.includes("low") || q.includes("tuesday")) {
        const sorted = [...daily].sort((a:any,b:any) => a.netCents-b.netCents);
        text = sorted.length ? `Lowest completed-sales day in the available report is ${sorted[0].date}: ${formatMoney(sorted[0].netCents)} from ${sorted[0].orders} orders. The report does not contain weather or foot-traffic data to explain the cause.` : "There are no completed sales in the available report yet.";
      } else {
        const revenue = daily.reduce((sum:number,row:any) => sum+row.netCents,0);
        text = `The available report contains ${daily.reduce((sum:number,row:any)=>sum+row.orders,0)} completed orders and ${formatMoney(revenue)} in net sales across ${daily.length} sales days. Ask for best-selling items, margin, or lowest sales day for a breakdown.`;
      }
      const chartData = daily.slice(0,7).reverse().map((row:any)=>({name:row.date.slice(5),value:Math.round(row.netCents/100)}));
      setMessages((prev) => [...prev, { id: `r-${Date.now()}`, sender: "ralypto", text, timestamp: "Just now", ...(chartData.length ? { chartLabel: "Recorded daily sales", chartData } : {}) }]);
    } catch { setMessages((prev) => [...prev, { id: `r-${Date.now()}`, sender: "ralypto", text: "I could not load the restaurant report. Check your connection or permissions and try again.", timestamp: "Just now" }]); }
  };

  const handleCopyWhatsapp = () => {
    const days = analytics?.daily_sales ?? []; const yesterday = [...days].sort((a:any,b:any)=>b.date.localeCompare(a.date))[0];
    const top = [...(analytics?.sales_by_item ?? [])].sort((a:any,b:any)=>b.units-a.units)[0];
    const text = `Restaurant sales briefing\n\nRecorded net sales: ${yesterday ? formatMoney(yesterday.netCents) + ` on ${yesterday.date}` : "No completed sales recorded"}\nTop item: ${top ? `${top.name} (${top.units} units)` : "No item sales recorded"}\nReservation and stock metrics are available in their connected modules.`;

    navigator.clipboard?.writeText(text);
    setCopiedWhatsapp(true);
    toast.success("WhatsApp Morning Briefing copied to clipboard!");
    setTimeout(() => setCopiedWhatsapp(false), 2500);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <PageHeader
        title="Ralypto AI Brain & Voice Assistant"
        description="'Just talk to Ralypto' — real-time sales answers, automated morning briefing, and machine-learning prep lists."
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <button
          onClick={() => setActiveTab("ask")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "ask"
              ? "bg-text text-surface shadow-md"
              : "text-muted hover:text-text hover:bg-surface"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Ask Ralypto (Hero 4)</span>
        </button>

        <button
          onClick={() => setActiveTab("briefing")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "briefing"
              ? "bg-text text-surface shadow-md"
              : "text-muted hover:text-text hover:bg-surface"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Daily Morning Briefing</span>
        </button>

        <button
          onClick={() => setActiveTab("forecast")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "forecast"
              ? "bg-text text-surface shadow-md"
              : "text-muted hover:text-text hover:bg-surface"
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span>Demand Forecast & Prep List (Hero 5)</span>
        </button>
      </div>

      {/* Tab 1: Ask Ralypto */}
      {activeTab === "ask" && (
        <div className="rounded-card border border-border bg-surface shadow-card overflow-hidden flex flex-col h-[650px]">
          {/* Chat header */}
          <div className="p-4 border-b border-border/40 bg-surface/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-brand flex items-center justify-center text-surface shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-text flex items-center gap-2">
                  <span>Ask Ralypto</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-emerald-600 font-mono uppercase">Live Data</span>
                </div>
                <p className="text-xs text-muted">Answers derived strictly from real POS transactions.</p>
              </div>
            </div>

            <div className="text-xs text-muted font-mono hidden sm:block">
              Rules: Proposes & answers · Zero invented facts
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-2xl ${
                  msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {msg.sender === "ralypto" && (
                  <div className="w-8 h-8 rounded-xl bg-brand text-surface flex items-center justify-center shrink-0 text-xs font-bold">
                    R
                  </div>
                )}
                <div
                  className={`p-4 rounded-2xl text-xs space-y-3 leading-relaxed shadow-sm ${
                    msg.sender === "user"
                      ? "bg-text text-surface font-medium rounded-tr-none"
                      : "bg-bg border border-border text-text rounded-tl-none"
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Optional Chart */}
                  {msg.chartData && (
                    <div className="mt-3 pt-3 border-t border-border/40">
                      <div className="text-[11px] font-bold text-muted mb-2 font-mono">
                        {msg.chartLabel}
                      </div>
                      <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={msg.chartData}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} />
                            <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#000",
                                border: "1px solid #333",
                                borderRadius: "8px",
                                fontSize: "11px",
                              }}
                            />
                            <Bar dataKey="value" fill="#000000" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-muted text-right font-mono">{msg.timestamp}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Preset Questions Chips */}
          <div className="px-4 py-2 border-t border-border/40 bg-surface/40 flex items-center gap-2 overflow-x-auto shrink-0">
            <span className="text-[11px] font-semibold text-muted shrink-0 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> Suggestions:
            </span>
            {presetQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleSendQuery(q)}
                className="text-[11px] px-3 py-1 rounded-full border border-border bg-bg hover:bg-surface text-muted hover:text-text font-medium whitespace-nowrap transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input row */}
          <div className="p-3 border-t border-border bg-surface shrink-0 flex items-center gap-2">
            <MicButton
              size="md"
              label=""
              onTranscript={(transcript) => handleSendQuery(transcript)}
            />
            <input
              type="text"
              placeholder="Ask anything about sales, food costs, or peak hours... (or tap mic)"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendQuery(inputQuery);
              }}
              className="flex-1 px-4 py-2.5 rounded-full bg-bg border border-border text-xs text-text placeholder-muted focus:outline-none focus:ring-1 focus:ring-text"
            />
            <button
              onClick={() => handleSendQuery(inputQuery)}
              disabled={!inputQuery.trim()}
              className="p-2.5 rounded-full bg-text text-surface disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Daily Morning Summary */}
      {activeTab === "briefing" && (
        <div className="space-y-4">
          <div className="rounded-card border border-border bg-surface p-6 shadow-card space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/40">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-text">WhatsApp Morning Briefing</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    Live report summary
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Build a shareable summary from the latest recorded sales. Copy sends nothing externally.
                </p>
              </div>

              <button
                onClick={handleCopyWhatsapp}
                className="px-3.5 py-2 rounded-xl bg-text text-surface text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-opacity self-start sm:self-auto"
              >
                {copiedWhatsapp ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedWhatsapp ? "Copied!" : "Copy WhatsApp Message"}</span>
              </button>
            </div>

            {/* Simulated WhatsApp Phone Bubble */}
            <div className="max-w-md mx-auto p-5 rounded-3xl bg-zinc-950 text-white font-sans border border-zinc-800 shadow-2xl space-y-3.5">
              <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800/80 pb-2">
                <span className="font-semibold text-emerald-400">Ralypto Executive AI</span>
                <span>07:00 AM</span>
              </div>

              <div className="space-y-3 text-xs leading-relaxed">
                <p className="font-bold text-sm text-zinc-100">
                  Current restaurant report summary:
                </p>

                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Yesterday's Sales:</span>
                    <span className="font-black font-mono text-emerald-400">
                      {analytics?.daily_sales?.length ? formatMoney([...analytics.daily_sales].sort((a:any,b:any)=>b.date.localeCompare(a.date))[0].netCents) : "No sales recorded"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Top Star Dish:</span>
                    <span className="font-bold text-zinc-200">{[...(analytics?.sales_by_item ?? [])].sort((a:any,b:any)=>b.units-a.units)[0]?.name ?? "No item sales recorded"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Completed-order days:</span>
                    <span className="font-bold text-zinc-400">{analytics?.daily_sales?.length ?? 0}</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <span className="font-bold">Low Stock Warning: </span>
                    Stock thresholds are shown in Inventory. No consumption forecast is available.
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[11px] flex items-start gap-2">
                  <Calendar className="w-4 h-4 shrink-0 mt-0.5 text-sky-400" />
                  <div>
                    <span className="font-bold">Today's Bookings: </span>
                    {analytics ? "Reservation totals are available on the Reservations screen." : "Loading report data…"}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">Daily Recommendation: </span>
                    Prep suggestion: review the most ordered items below. Historical sales do not predict tomorrow's demand.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Demand Forecast + Prep List (Hero 5) */}
      {activeTab === "forecast" && (
        <div className="space-y-6">
          {/* Top Prediction Banner */}
          <div className="p-6 rounded-card border border-border bg-surface shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-text">Recorded Demand Summary</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand text-surface">Historical sales</span>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Ranked from completed orders currently stored by this restaurant.
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs text-muted font-medium">Recorded completed orders</div>
                <div className="text-2xl font-black text-text font-mono">{(analytics?.daily_sales ?? []).reduce((sum:number,row:any)=>sum+row.orders,0)} orders</div>
              </div>
            </div>

            {/* Prep List Card */}
            <div className="mt-4 pt-4 border-t border-border/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-brand" />
                  <h4 className="text-sm font-bold text-text">Kitchen Morning Prep List</h4>
                </div>
                <span className="text-xs text-muted font-mono">Top selling items in available records</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {[...(analytics?.sales_by_item ?? [])].sort((a:any,b:any)=>b.units-a.units).slice(0,4).map((prepItem:any) => (
                  <div
                    key={prepItem.item}
                    className="p-3.5 rounded-2xl border border-border bg-bg/60 space-y-1"
                  >
                    <div className="text-xs text-muted">{prepItem.item}</div>
                    <div className="text-base font-bold text-text font-mono">{prepItem.units} sold</div>
                    <div className="text-[11px] text-muted italic">{formatMoney(prepItem.totalCents)} recorded sales</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Smart Stock Reorder Draft */}
          <div className="p-6 rounded-card border border-border bg-surface shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                <h4 className="text-sm font-bold text-text">Low Stock Check</h4>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                Live inventory thresholds
              </span>
            </div>

            <p className="text-xs text-muted">
              Items at or below their reorder threshold are listed here. Quantity history is not available for burn-rate forecasting.
            </p>

            <div className="p-4 rounded-2xl bg-bg border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-sm font-bold text-text">Inventory is the source of current stock quantities and reorder levels.</div>
                <div className="text-xs text-muted">Add stock items and set thresholds there to review low stock.</div>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard?.writeText(
                    "Please review the current stock register and confirm the items available for reorder."
                  );
                  toast.success("Supplier WhatsApp order message copied to clipboard!");
                }}
                className="px-4 py-2 rounded-xl bg-text text-surface text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Copy supplier inquiry</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AiAssistantPage;
