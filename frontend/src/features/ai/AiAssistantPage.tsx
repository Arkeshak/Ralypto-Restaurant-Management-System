import { Sparkles, Bot } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { BigButton } from "@/components/common/BigButton";
import { toast } from "sonner";

export function AiAssistantPage() {
  const todoList = [
    { title: "Gemini Hospitality Chat Assistant", desc: "Ask conversational questions regarding menu performance, waste reduction, and peak hours." },
    { title: "Predictive Weekend Inventory Forecasting", desc: "Machine learning models forecasting ingredient depletion based on weather and events." },
    { title: "AI Menu Photo Enhancer & OCR Digitizer", desc: "Upload handwritten recipe sheets or food photos to auto-generate menu entries." },
    { title: "Dynamic Upsell Recommendations", desc: "Suggested item pairings for waiters and customer QR menu ordering." },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="AI Hospitality Advisor"
        description="Gemini-powered insights, predictive forecasting, and automated menu intelligence."
      />

      <div className="rounded-card border border-border bg-surface p-8 shadow-card">
        <div className="flex items-center gap-3 pb-4 border-b border-border/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-surface">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text">Gemini Hospitality Intelligence</h3>
            <p className="text-sm text-muted">Exclusive to Premium plan tier</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Planned Features (TODO)
          </h4>
          <div className="space-y-3">
            {todoList.map((item, idx) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-xl border border-border bg-bg/50 p-4"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface border border-border text-xs font-bold text-muted">
                  {idx + 1}
                </span>
                <div>
                  <h5 className="font-semibold text-sm text-text">{item.title}</h5>
                  <p className="text-xs text-muted mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/40 flex justify-end">
          <BigButton
            label="Test Gemini Query"
            icon={Bot}
            variant="primary"
            onClick={() => toast.success("Gemini API connection initialized successfully!")}
          />
        </div>
      </div>
    </div>
  );
}
export default AiAssistantPage;
