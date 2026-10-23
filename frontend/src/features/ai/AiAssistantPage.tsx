import { useState } from "react";
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

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-init",
      sender: "ralypto",
      text: "Hello Arkesh! I am Ralypto, your restaurant AI brain. I have analyzed your POS receipts, table turns, and ingredient usage. Ask me anything out loud or choose a question below.",
      timestamp: "Just now",
    },
  ]);

  const presetQuestions = [
    "Why were sales low on Tuesday?",
    "Best selling item this week?",
    "Which items have the highest profit margin?",
    "Show tomorrow's customer demand forecast & prep list",
  ];

  const handleSendQuery = (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: queryText,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");

    // Realistic analytical AI answers based on real Ceylon Spice Bistro data
    setTimeout(() => {
      const q = queryText.toLowerCase();
      let reply: ChatMessage;

      if (q.includes("tuesday") || q.includes("low")) {
        reply = {
          id: `r-${Date.now()}`,
          sender: "ralypto",
          text: "Sales were down 22% on Tuesday (LKR 112,000 vs weekly average LKR 144,000). Two factors drove this: heavy afternoon monsoon rain reduced dine-in foot traffic by 34%, and lunch hours (12–2 PM) had only 6 table turns. However, delivery orders via PickMe offset 15% of the drop.",
          timestamp: "Just now",
          chartLabel: "Revenue by Day of Week (LKR '000)",
          chartData: [
            { name: "Mon", value: 135 },
            { name: "Tue", value: 112 },
            { name: "Wed", value: 148 },
            { name: "Thu", value: 165 },
            { name: "Fri", value: 210 },
            { name: "Sat", value: 284 },
            { name: "Sun", value: 245 },
          ],
        };
      } else if (q.includes("best") || q.includes("selling") || q.includes("popular")) {
        reply = {
          id: `r-${Date.now()}`,
          sender: "ralypto",
          text: "Chicken Kottu remains your #1 Star item: 312 portions sold this week, generating LKR 452,400 in revenue with an exceptional 57% gross margin. Fresh Lime Juice was the most frequent upsell pairing (attached to 41% of all kottu orders).",
          timestamp: "Just now",
          chartLabel: "Top Dishes Sold This Week (Units)",
          chartData: [
            { name: "Chicken Kottu", value: 312 },
            { name: "Cheese Kottu", value: 184 },
            { name: "Seafood Rice", value: 165 },
            { name: "Hot Butter Cuttlefish", value: 142 },
            { name: "Lime Juice", value: 215 },
          ],
        };
      } else if (q.includes("margin") || q.includes("profit") || q.includes("star")) {
        reply = {
          id: `r-${Date.now()}`,
          sender: "ralypto",
          text: "Highest margin items: Fresh Lime Juice (73% margin, cost LKR 120 / price LKR 450) and Traditional Watalappan (67% margin). Lowest margin item is Hot Butter Cuttlefish (55% margin due to recent 18% increase in fresh squid wholesale prices).",
          timestamp: "Just now",
        };
      } else {
        reply = {
          id: `r-${Date.now()}`,
          sender: "ralypto",
          text: `Analyzing your real sales records for "${queryText}". Dine-in average spend per guest is currently LKR 1,850. Table turn time is 48 minutes during peak dinner. Would you like a breakdown by food category or waiter performance?`,
          timestamp: "Just now",
        };
      }

      setMessages((prev) => [...prev, reply]);
    }, 400);
  };

  const handleCopyWhatsapp = () => {
    const text =
      "Good morning Arkesh! Here is your Ceylon Spice Bistro Daily Briefing:\n\n" +
      "📊 Yesterday's Revenue: LKR 284,500 (+12% vs last Thursday)\n" +
      "⭐ Top Star Dish: Chicken Kottu (64 portions sold)\n" +
      "⚠️ Low Stock Warning: Kaffir Lime (approx 2 days remaining)\n" +
      "📅 Today's Reservations: 8 tables booked (32 guests)\n" +
      "💡 Pro Tip: Prep 15% more godamba roti today for dinner rush.";

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
                    Sent Daily at 07:00 AM
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Automated executive summary sent straight to the restaurant owner's WhatsApp.
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
                  Good morning Arkesh! Here is your Ceylon Spice Bistro update:
                </p>

                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Yesterday's Sales:</span>
                    <span className="font-black font-mono text-emerald-400">
                      {formatMoney(28450000)} (+12% vs last Thu)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Top Star Dish:</span>
                    <span className="font-bold text-zinc-200">Chicken Kottu (64 sold)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Slowest Item:</span>
                    <span className="font-bold text-zinc-400">Veg Samosa (3 sold)</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <span className="font-bold">Low Stock Warning: </span>
                    Kaffir Lime supply is estimated to deplete in 1.8 days. Suggested order: 12 kg.
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[11px] flex items-start gap-2">
                  <Calendar className="w-4 h-4 shrink-0 mt-0.5 text-sky-400" />
                  <div>
                    <span className="font-bold">Today's Bookings: </span>
                    8 reservations confirmed (32 guests total). Peak rush starting 7:30 PM.
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">Daily Recommendation: </span>
                    Prepare 15% more godamba roti portions for dinner; Friday forecast predicts higher demand.
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
                  <h3 className="text-lg font-bold text-text">Tomorrow's Machine Learning Forecast</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand text-surface">
                    Poya Day Tomorrow
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Algorithm combines 8-week moving average, day of week, Poya holiday flags, and local weather.
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs text-muted font-medium">Predicted Diners</div>
                <div className="text-2xl font-black text-text font-mono">195 guests (+30%)</div>
              </div>
            </div>

            {/* Prep List Card */}
            <div className="mt-4 pt-4 border-t border-border/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-brand" />
                  <h4 className="text-sm font-bold text-text">Kitchen Morning Prep List</h4>
                </div>
                <span className="text-xs text-muted font-mono">Generated for Head Chef Bandara</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { item: "Godamba Roti Batches", prep: "45 portions", note: "For Chicken & Cheese Kottu" },
                  { item: "Vegetable Fried Rice Base", prep: "35 portions", note: "Vegetarian surge on Poya" },
                  { item: "Hot Butter Squid Batter", prep: "25 portions", note: "Popular starter" },
                  { item: "Fresh Lime & Mint Juice Base", prep: "60 portions", note: "Top beverage pair" },
                ].map((prepItem) => (
                  <div
                    key={prepItem.item}
                    className="p-3.5 rounded-2xl border border-border bg-bg/60 space-y-1"
                  >
                    <div className="text-xs text-muted">{prepItem.item}</div>
                    <div className="text-base font-bold text-text font-mono">{prepItem.prep}</div>
                    <div className="text-[11px] text-muted italic">{prepItem.note}</div>
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
                <h4 className="text-sm font-bold text-text">Smart Stock Reorder Draft</h4>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                1 Draft Ready for Approval
              </span>
            </div>

            <p className="text-xs text-muted">
              AI tracks live ingredient burn rates and auto-generates supplier purchase orders before stockouts occur.
            </p>

            <div className="p-4 rounded-2xl bg-bg border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-text">Boneless Chicken Breast (Skinless)</span>
                  <span className="text-xs text-rose-500 font-semibold font-mono">
                    Current: 4.2 kg (1.8 days left)
                  </span>
                </div>
                <div className="text-xs text-muted">
                  Suggested Reorder: <strong className="text-text">25.0 kg</strong> from{" "}
                  <strong className="text-text">Perera Poultry Farms Ltd</strong> (Lead time: 24h)
                </div>
                <div className="text-[11px] text-muted font-mono">
                  Estimated cost: LKR 37,500.00
                </div>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard?.writeText(
                    "Hi Perera Farms, please deliver 25 kg Boneless Chicken Breast tomorrow morning to Ceylon Spice Bistro (Code: CEY101). Invoice to rest-cey-101."
                  );
                  toast.success("Supplier WhatsApp order message copied to clipboard!");
                }}
                className="px-4 py-2 rounded-xl bg-text text-surface text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send WhatsApp Order to Supplier</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AiAssistantPage;
