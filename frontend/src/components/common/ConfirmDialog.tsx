import React, { useState, useEffect } from "react";
import { BigButton } from "./BigButton";
import { AlertTriangle, Lock, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  requiresPin?: boolean;
  onConfirm: (pin?: string) => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  isDestructive = true,
  requiresPin = false,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = React.useCallback(() => {
    if (requiresPin) {
      if (!pin || pin.length !== 4) {
        setError("Please enter a 4-digit Manager PIN");
        return;
      }
    }
    onConfirm(pin);
    setPin("");
    setError("");
  }, [requiresPin, pin, onConfirm]);

  useEffect(() => {
    if (!isOpen) {
      setPin("");
      setError("");
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      } else if (e.key === "Enter" && !requiresPin) {
        handleConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, requiresPin, handleConfirm, onCancel]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-md overflow-hidden rounded-card border border-border bg-surface p-6 shadow-xl"
        >
          <button
            onClick={onCancel}
            aria-label="Close dialog"
            className="absolute right-4 top-4 rounded-full p-2 text-muted hover:text-text hover:bg-bg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-start gap-4 mb-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                isDestructive
                  ? "bg-danger-soft text-danger"
                  : "bg-brand-soft text-brand"
              }`}
            >
              {requiresPin ? <Lock className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-xl font-semibold tracking-[-0.02em] text-text">{title}</h3>
              <p className="mt-1 text-sm text-muted">{description}</p>
            </div>
          </div>

          {requiresPin && (
            <div className="my-5 p-4 rounded-xl bg-bg border border-border">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                Manager Authorization PIN
              </label>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirm();
                }}
                placeholder="••••"
                className="w-full h-12 px-4 text-center tracking-[1em] text-2xl font-mono rounded-lg bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-info"
                autoFocus
              />
              {error && <p className="mt-2 text-xs text-danger font-medium">{error}</p>}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <BigButton
              label={cancelLabel || t("common.cancel", "Cancel")}
              variant="secondary"
              full
              onClick={() => {
                setPin("");
                setError("");
                onCancel();
              }}
            />
            <BigButton
              label={confirmLabel || t("common.confirm", "Confirm")}
              variant={isDestructive ? "danger" : "primary"}
              full
              onClick={handleConfirm}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
