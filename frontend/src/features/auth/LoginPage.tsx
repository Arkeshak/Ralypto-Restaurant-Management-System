import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/endpoints/auth';
import { useAuthStore } from '../../stores/auth.store';
import { getRoleLandingRoute } from '../../lib/permissions';
import { BigButton } from '../../components/common/BigButton';
import { useTranslation } from 'react-i18next';
import { KeyRound, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('owner@ralypto.com');
  const [password, setPassword] = useState('pass123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { t } = useTranslation();

  const handleLogin = async (e?: React.FormEvent, customEmail?: string) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const targetEmail = customEmail || email;

    try {
      const res = await authApi.login({
        email: targetEmail,
        password: 'pass123',
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
    } catch (err: any) {
      setError(err.message || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const demoRoles = [
    { label: 'Owner / Manager', email: 'owner@ralypto.com', role: 'owner' },
    { label: 'Cashier (POS)', email: 'cashier@ralypto.com', role: 'cashier' },
    { label: 'Floor Waiter', email: 'waiter@ralypto.com', role: 'waiter' },
    { label: 'Kitchen Chef', email: 'kitchen@ralypto.com', role: 'kitchen' },
    { label: 'Accountant', email: 'accountant@ralypto.com', role: 'accountant' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-charcoal selection:bg-brand-500 selection:text-white">
      <div className="relative w-full max-w-md p-8 rounded-3xl glass-panel border border-zinc-800 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-950/80 border border-brand-800 flex items-center justify-center mb-4 glow-brand">
            <img src="/logo.svg" alt="Ralypto" className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{t('auth.title')}</h1>
          <p className="mt-1 text-sm text-zinc-400">{t('auth.subtitle')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800/60 text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              {t('auth.emailLabel')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@ralypto.com"
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              {t('auth.passwordLabel')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 text-sm"
              />
            </div>
          </div>

          <div className="pt-2">
            <BigButton
              type="submit"
              variant="brand"
              size="touch-lg"
              fullWidth
              disabled={loading}
              icon={<ArrowRight className="w-5 h-5" />}
            >
              {loading ? t('common.loading') : t('auth.loginButton')}
            </BigButton>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
          <Link
            to="/pin-login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-400 hover:text-brand-300 transition-colors"
          >
            <KeyRound className="w-4 h-4" />
            <span>{t('auth.switchToPin')}</span>
          </Link>
        </div>

        {/* Quick Demo Role Logins */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80">
          <p className="text-xs font-semibold text-zinc-400 mb-3 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-brand-500" />
            <span>{t('auth.demoAccounts')}</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {demoRoles.map((demo) => (
              <button
                key={demo.role}
                type="button"
                onClick={() => {
                  setEmail(demo.email);
                  handleLogin(undefined, demo.email);
                }}
                className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left transition-colors group"
              >
                <p className="text-xs font-bold text-zinc-200 group-hover:text-brand-400">
                  {demo.label}
                </p>
                <p className="text-[10px] text-zinc-500 truncate">{demo.email}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
