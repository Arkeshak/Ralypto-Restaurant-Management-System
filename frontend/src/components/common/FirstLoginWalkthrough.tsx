import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Search,
  WifiOff,
  Clock,
  Split,
  Printer,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
} from "lucide-react";
import { useUiStore } from "@/stores/ui.store";

const TIPS = [
  {
    icon: Search,
    title: "1. Rapid Search",
    subtitle: "Navigate with zero lag",
    description:
      "Press '/' on your keyboard or tap the search bar anywhere in POS to immediately filter dishes by name or category.",
    badge: "POS Shortcut",
  },
  {
    icon: WifiOff,
    title: "2. 100% Offline Resilience",
    subtitle: "Never lose a customer order",
    description:
      "If Wi-Fi drops, tickets are safely stored in local IndexedDB. As soon as connectivity returns, orders sync automatically with backoff retries.",
    badge: "Zero Downtime",
  },
  {
    icon: Clock,
    title: "3. Live Kitchen Late Timers",
    subtitle: "Prioritize delayed orders",
    description:
      "Kitchen tickets monitor preparation time in real-time. Orders turn amber after 10 minutes and high-contrast red after 20 minutes.",
    badge: "Kitchen Display",
  },
  {
    icon: Split,
    title: "4. Flexible Bill Splitting",
    subtitle: "Equal or itemized payments",
    description:
      "Split bills equally among up to 6 guests with exact cent distribution, or tick individual items for separate checkout.",
    badge: "Billing",
  },
  {
    icon: Printer,
    title: "5. 80mm Print & WhatsApp",
    subtitle: "Modern thermal & digital receipts",
    description:
      "Print clean 80mm thermal receipts without browser margins, or instantly send itemized bills directly to the guest's WhatsApp.",
    badge: "Hardware & Share",
  },
];

export function FirstLoginWalkthrough() {
  const { isWalkthroughOpen, setWalkthroughOpen } = useUiStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-open on first login if not dismissed before
  useEffect(() => {
    const isDismissed = localStorage.getItem("ralypto_walkthrough_dismissed") === "true";
    if (!isDismissed) {
      setWalkthroughOpen(true);
    }
  }, [setWalkthroughOpen]);

  if (!isWalkthroughOpen) return null;

  const currentTip = TIPS[currentIndex];
  const Icon = currentTip.icon;
  const isLast = currentIndex === TIPS.length - 1;

  const handleDismiss = () => {
    localStorage.setItem("ralypto_walkthrough_dismissed", "true");
    setWalkthroughOpen(false);
  };

  const handleNext = () => {
    if (isLast) {
      handleDismiss();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-2xl text-text overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={handleDismiss}
            aria-label="Close walkthrough"
            className="absolute top-5 right-5 p-2 rounded-full text-muted hover:text-text hover:bg-bg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header indicator */}
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand mb-4">
            <Sparkles className="h-4 w-4" />
            <span>Staff Walkthrough · Tip {currentIndex + 1} of {TIPS.length}</span>
          </div>

          {/* Dynamic Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-surface shadow-md">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="rounded-full border border-border bg-bg px-3 py-1 text-xs font-semibold text-muted">
                  {currentTip.badge}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold tracking-tight text-text">
                  {currentTip.title}
                </h3>
                <p className="text-xs font-semibold text-muted mt-0.5">
                  {currentTip.subtitle}
                </p>
              </div>

              <p className="text-sm text-text/80 leading-relaxed bg-bg/50 p-4 rounded-2xl border border-border/40">
                {currentTip.description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Step dots */}
          <div className="flex justify-center gap-1.5 my-6">
            {TIPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Jump to tip ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === currentIndex ? "w-6 bg-brand" : "w-2 bg-border hover:bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <button
              onClick={handleDismiss}
              className="text-xs font-semibold text-muted hover:text-text transition-colors"
            >
              Skip Tour
            </button>

            <div className="flex items-center gap-2">
              {currentIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1 px-3 py-2 rounded-full border border-border text-xs font-semibold hover:bg-bg transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
              )}

              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-brand text-surface text-xs font-bold shadow hover:opacity-90 transition-opacity"
              >
                <span>{isLast ? "Got It!" : "Next Tip"}</span>
                {isLast ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
