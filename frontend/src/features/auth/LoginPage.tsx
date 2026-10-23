import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { authApi } from "@/api/endpoints/auth";
import { useAuthStore } from "@/stores/auth.store";
import { getRoleLandingRoute } from "@/lib/permissions";
import { BigButton } from "@/components/common/BigButton";
import { useTranslation } from "react-i18next";
import { KeyRound, Lock, Mail, ArrowRight, Eye, EyeOff, Globe } from "lucide-react";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { i18n } = useTranslation();

  const handleLogin = async (e?: React.FormEvent, customEmail?: string) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);

    const targetEmail = customEmail || email;

    try {
      const res = await authApi.login({
        email: targetEmail,
        password: password || "pass123",
      });

      setAuth({
        token: res.accessToken,
        user: res.user,
        restaurant: res.restaurant,
        plan: res.plan,
        featureFlags: res.featureFlags,
      });

      // Prefetch POS route after login
      import("@/features/pos/PosPage").catch(() => {});

      const landingRoute = getRoleLandingRoute(res.user.role);
      navigate(landingRoute, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const demoRoles =
    import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === "true"
      ? [
          { label: "Owner / Manager", email: "owner@ralypto.com" },
          { label: "Cashier (POS)", email: "cashier@ralypto.com" },
          { label: "Floor Waiter", email: "waiter@ralypto.com" },
          { label: "Kitchen Chef", email: "kitchen@ralypto.com" },
        ]
      : [];

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
        className="w-full max-w-md rounded-card border border-border bg-surface p-8 shadow-card"
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-surface font-bold text-2xl tracking-tighter mb-3">
            R
          </div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-text">Sign in to Ralypto</h1>
          <p className="mt-1 text-sm text-muted">Management & reporting access</p>
        </div>

        {error && (
          <div className="mb-4 rounded-btn bg-danger-soft border border-danger/20 p-3 text-sm font-medium text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@restaurant.com"
                className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-bg text-text text-sm focus:outline-none focus:ring-2 focus:ring-info"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-muted" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 pl-11 pr-12 rounded-xl border border-border bg-bg text-text text-sm focus:outline-none focus:ring-2 focus:ring-info"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-muted hover:text-text p-0.5"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <BigButton
              label={loading ? "Signing in..." : "Sign in"}
              icon={ArrowRight}
              variant="primary"
              full
              disabled={loading}
              loading={loading}
              type="submit"
            />
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-border/60 text-center">
          <Link
            to="/pin-login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
          >
            <KeyRound className="h-4 w-4" />
            <span>Staff PIN Login (Cashier / Waiter / Kitchen)</span>
          </Link>
        </div>

        {/* Quick Demo Sign-ins (Dev Mock only) */}
        {import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === "true" && demoRoles.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border/40">
            <p className="text-xs font-semibold text-muted mb-2">Quick Demo Sign In</p>
            <div className="grid grid-cols-2 gap-2">
              {demoRoles.map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => {
                    setEmail(demo.email);
                    handleLogin(undefined, demo.email);
                  }}
                  className="p-2 rounded-lg border border-border bg-bg text-left hover:border-brand transition-colors text-xs"
                >
                  <div className="font-semibold text-text truncate">{demo.label}</div>
                  <div className="text-[10px] text-muted truncate">{demo.email}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
export default LoginPage;
