import React, { useState } from 'react';
import { HelpCircle, MessageCircle, PlayCircle, X, ExternalLink, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUiStore } from '@/stores/ui.store';

export const FloatingHelpButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {/* Floating Trigger Button */}
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-12 w-12 rounded-full bg-brand text-surface shadow-2xl flex items-center justify-center hover:opacity-95 transition-all"
        title="Need Help?"
        aria-label="Need Help?"
      >
        {isOpen ? <X className="h-6 w-6" /> : <HelpCircle className="h-6 w-6" />}
      </motion.button>

      {/* Help Panel Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute bottom-16 right-0 w-80 rounded-3xl bg-surface border border-border shadow-2xl p-5 text-text space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div>
                <h4 className="font-bold text-sm text-text">Need Help?</h4>
                <p className="text-xs text-muted">24/7 Restaurant Support</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="h-7 w-7 rounded-full hover:bg-bg flex items-center justify-center text-muted hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Option 1: WhatsApp Support */}
              <a
                href="https://wa.me/94771234567?text=Hi%20Ralypto%20Support,%20I%20need%20help%20with%20my%20restaurant%20POS."
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 transition-colors"
              >
                <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-xs text-text block">Chat on WhatsApp</span>
                  <span className="text-[11px] text-muted">Instant response in ~5 mins</span>
                </div>
              </a>

              {/* Option 2: 1-Minute Guide Video */}
              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-bg/50 hover:bg-bg text-text transition-colors"
              >
                <div className="h-9 w-9 rounded-xl bg-brand text-surface flex items-center justify-center shrink-0">
                  <PlayCircle className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-xs text-text block">Watch 1-Minute Guide</span>
                  <span className="text-[11px] text-muted">Quick video walkthrough</span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted ml-auto" />
              </a>

              {/* Option 3: Staff Quick Tour */}
              <button
                onClick={() => {
                  useUiStore.getState().setWalkthroughOpen(true);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-border bg-bg/50 hover:bg-bg text-text transition-colors text-left"
              >
                <div className="h-9 w-9 rounded-xl border border-border bg-surface text-text flex items-center justify-center shrink-0">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-bold text-xs text-text block">Interactive Staff Tour</span>
                  <span className="text-[11px] text-muted">Review the 5-step shortcuts</span>
                </div>
              </button>

              {/* Option 4: Phone Hotline */}
              <div className="p-3 rounded-2xl border border-border bg-bg/30 flex items-center gap-3 text-xs">
                <Phone className="h-4 w-4 text-muted shrink-0" />
                <div>
                  <span className="font-semibold text-text block">Hotline: +94 11 234 5678</span>
                  <span className="text-[10px] text-muted">Available 8:00 AM - 11:00 PM</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
