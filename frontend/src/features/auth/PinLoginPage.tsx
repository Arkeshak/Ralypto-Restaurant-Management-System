import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { authApi } from "@/api/endpoints/auth";
import { useAuthStore } from "@/stores/auth.store";
import { getRoleLandingRoute } from "@/lib/permissions";
import { useTranslation } from "react-i18next";
import { Delete, Mail, Store, Globe } from "lucide-react";

export const PinLoginPage: React.FC = () => {
  const [restaurantCode, setRestaurantCode] = useState("CEY101");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { i18n } = useTranslation();

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError("");
      if (nextPin.length === 4) {
        submitPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError("");
  };

  const handleClear = () => {
    setPin("");
    setError("");
  };

  const submitPin = async (finalPin: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await authApi.pinLogin({
        restaurantCode,
        pin: finalPin,
      });

      setAuth({
        token: res.accessToken,
        user: res.user,
        restaurant: res.restaurant,
        plan: res.plan,
        featureFlags: res.featureFlags,
      });

      const landingRoute = getRoleLandingRoute(res.user.role);
      navigate(landingRoute, { replace: true });
    } catch {
      setError("Wrong PIN. Try again.");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-bg text-text selection:bg-brand selection:text-surface">
      {/* Top right language switch */}
      <div className="absolute top-6 right-6 flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 shadow-sm">
        <Globe className="h-4 w-4 text-muted" />
        <button
          onClick={() => i18n.changeLanguage("en")}
          className={`text-xs font-semibold ${i18n.language.startsWith("en") ? "text-brand" : "text-muted"}`}
        >
          EN
        </button>
        <span className="text-border">|</span>
        <button
          onClick={() => i18n.changeLanguage("si")}
          className={`text-xs font-semibold ${i18n.language.startsWith("si") ? "text-brand" : "text-muted"}`}
        >
          SI
        </button>
        <span className="text-border">|</span>
        <button
          onClick={() => i18n.changeLanguage("ta")}
          className={`text-xs font-semibold ${i18n.language.startsWith("ta") ? "text-brand" : "text-muted"}`}
        >
          TA
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-sm rounded-card border border-border bg-surface p-6 sm:p-8 shadow-card text-center"
      >
        <div className="flex flex-col items-center mb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-surface font-bold text-2xl tracking-tighter mb-3">
            R
          </div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-text">Staff Quick Access</h1>
          <p className="mt-1 text-xs text-muted">Enter your 4-digit staff PIN</p>
        </div>

        {/* Restaurant Code Input */}
        <div className="mb-4">
          <div className="relative">
            <Store className="absolute left-3.5 top-3 h-4 w-4 text-muted" />
            <input
              type="text"
              value={restaurantCode}
              onChange={(e) => setRestaurantCode(e.target.value.toUpperCase())}
              placeholder="RESTAURANT CODE"
              className="w-full h-10 pl-10 pr-4 text-center font-mono font-bold tracking-wider uppercase rounded-lg border border-border bg-bg text-text text-xs focus:outline-none focus:ring-2 focus:ring-info"
            />
          </div>
        </div>

        {/* PIN Indicators */}
        <div className="flex justify-center gap-4 my-4">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`h-4 w-4 rounded-full border transition-all duration-200 ${
                pin.length > idx
                  ? "bg-brand border-brand scale-110"
                  : "bg-surface border-border"
              }`}
            />
          ))}
        </div>

        {error && <p className="mb-3 text-xs text-danger font-semibold">{error}</p>}
        {loading && <p className="mb-3 text-xs text-muted animate-pulse">Verifying PIN...</p>}

        {/* Numeric Keypad (Ergonomic touch targets at least 56px) */}
        <div className="grid grid-cols-3 gap-2.5 my-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <motion.button
              key={digit}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => handleKeyPress(digit)}
              className="h-14 rounded-2xl border border-border bg-surface text-xl font-bold text-text shadow-sm hover:bg-bg transition-colors"
            >
              {digit}
            </motion.button>
          ))}
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={handleClear}
            className="h-14 rounded-2xl border border-border bg-bg text-xs font-semibold uppercase tracking-wider text-muted hover:text-text transition-colors"
          >
            Clear
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => handleKeyPress("0")}
            className="h-14 rounded-2xl border border-border bg-surface text-xl font-bold text-text shadow-sm hover:bg-bg transition-colors"
          >
            0
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={handleBackspace}
            aria-label="Backspace"
            className="h-14 rounded-2xl border border-border bg-bg flex items-center justify-center text-muted hover:text-text transition-colors"
          >
            <Delete className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Link back to Email login */}
        <div className="mt-4 pt-4 border-t border-border/60 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-brand hover:underline"
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Owner / Manager Email Sign In</span>
          </Link>
        </div>

        {/* Demo PIN hints */}
        <div className="mt-4 p-2.5 rounded-xl bg-bg border border-border/60 text-[11px] text-muted">
          <p className="font-semibold text-text mb-1">Demo PINs (Code: CEY101):</p>
          <div className="flex justify-around">
            <span>Cashier: <b className="text-text">2222</b></span>
            <span>Waiter: <b className="text-text">3333</b></span>
            <span>Kitchen: <b className="text-text">4444</b></span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default PinLoginPage;
