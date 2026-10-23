import React, { useState } from 'react';
import { Sparkles, Send, Bot, Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';
import { BigButton } from '../../components/common/BigButton';

export const AiAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: "Hello Arkesh! I'm your Ralypto AI business advisor. Today's top-performing dish is Chicken Kottu (42 portions sold, 68% profit margin). How can I help optimize your floor operations or procurement today?",
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `Based on your sales pattern for "${userMsg}", Friday evenings typically see a 35% surge in Kottu and Devilled dishes. I recommend ordering 15kg additional chicken breast by 2:00 PM today to prevent stockouts.`,
        },
      ]);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl glass-card border border-zinc-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-2xl bg-amber-950/80 text-amber-500 border border-amber-800/60">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Gemini AI Restaurant Intelligence</h1>
            <p className="text-sm text-zinc-400">
              Conversational sales advisor, predictive stock replenishment, and automated menu engineering
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Chat Assistant */}
        <div className="lg:col-span-2 p-5 rounded-2xl glass-panel border border-zinc-800 flex flex-col h-[520px]">
          <h3 className="text-sm font-bold text-zinc-300 pb-3 border-b border-zinc-800 flex items-center gap-2">
            <Bot className="w-4 h-4 text-brand-500" />
            <span>Operational Sales Advisor Chat</span>
          </h3>

          <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-brand-600 text-white rounded-br-xs'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-xs'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="pt-3 border-t border-zinc-800 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about margins, stock levels, or weekend rush forecasts..."
              className="flex-1 h-12 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-brand-500"
            />
            <BigButton type="submit" variant="brand" size="icon" aria-label="Send query">
              <Send className="w-4 h-4" />
            </BigButton>
          </form>
        </div>

        {/* AI Insight Cards */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl glass-panel border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <TrendingUp className="w-4 h-4" />
              <span>Menu Matrix Insight</span>
            </div>
            <h4 className="font-bold text-white text-sm">Star Dish: Seafood Fried Rice</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Consistently yields 72% gross margin and ranks in the top 5% of customer re-order frequency.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Stockout Warning</span>
            </div>
            <h4 className="font-bold text-white text-sm">Basmati Rice Reorder Due</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Current stock (14kg) will deplete before Saturday 8:00 PM based on past 4 weekend patterns.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
              <Lightbulb className="w-4 h-4" />
              <span>Upsell Pairing</span>
            </div>
            <h4 className="font-bold text-white text-sm">Suggest Iced Milo Dinosaur</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Diners ordering Cheese Kottu have a 48% positive conversion when suggested Iced Milo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
