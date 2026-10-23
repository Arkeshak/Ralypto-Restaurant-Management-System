import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/endpoints/auth';
import { useAuthStore } from '../../stores/auth.store';
import { getRoleLandingRoute } from '../../lib/permissions';
import { useTranslation } from 'react-i18next';
import { Delete, Mail, Store } from 'lucide-react';

export const PinLoginPage: React.FC = () => {
  const [restaurantCode, setRestaurantCode] = useState('CEY101');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { t } = useTranslation();

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 4) {
        submitPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const submitPin = async (finalPin: string) => {
    setLoading(true);
    setError('');

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
    } catch (err: any) {
      setError(err.message || t('auth.invalidPin'));
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-charcoal selection:bg-brand-500 selection:text-white">
      <div className="relative w-full max-w-sm p-6 sm:p-8 rounded-3xl glass-panel border border-zinc-800 shadow-2xl text-center">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-950/80 border border-brand-800 flex items-center justify-center mb-3 glow-brand">
            <img src="/logo.svg" alt="Ralypto" className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">{t('auth.pinTitle')}</h1>
          <p className="mt-1 text-xs text-zinc-400">{t('auth.pinSubtitle')}</p>
        </div>

        {/* Restaurant Code Input */}
        <div className="mb-4">
          <div className="relative">
            <Store className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={restaurantCode}
              onChange={(e) => setRestaurantCode(e.target.value.toUpperCase())}
              placeholder="Restaurant Code"
              className="w-full h-10 pl-10 pr-4 text-center font-mono font-bold tracking-wider uppercase rounded-xl bg-zinc-900 border border-zinc-700/80 text-white text-xs focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* PIN Indicators */}
        <div className="flex justify-center gap-4 my-4">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                pin.length > idx
                  ? 'bg-brand-500 border-brand-400 scale-110 shadow-[0_0_10px_rgba(220,38,38,0.7)]'
                  : 'bg-zinc-900 border-zinc-700'
              }`}
            />
          ))}
        </div>

        {error && <p className="mb-3 text-xs text-red-400 font-semibold">{error}</p>}
        {loading && <p className="mb-3 text-xs text-zinc-400 animate-pulse">{t('common.loading')}</p>}

        {/* Numeric Keypad (Ergonomic touch targets min 48px) */}
        <div className="grid grid-cols-3 gap-2.5 my-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-14 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:scale-95 border border-zinc-800 text-xl font-bold text-white transition-all touch-target"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800 active:scale-95 border border-zinc-800/80 text-xs font-bold uppercase tracking-wider text-zinc-400 transition-all touch-target"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:scale-95 border border-zinc-800 text-xl font-bold text-white transition-all touch-target"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Backspace"
            className="h-14 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800 active:scale-95 border border-zinc-800/80 flex items-center justify-center text-zinc-400 transition-all touch-target"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Link back to Email login */}
        <div className="mt-4 pt-4 border-t border-zinc-800 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{t('auth.switchToEmail')}</span>
          </Link>
        </div>

        {/* Demo PIN hints */}
        <div className="mt-4 p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 text-[11px] text-zinc-400">
          <p className="font-semibold text-zinc-300 mb-1">Demo PINs (Code: CEY101):</p>
          <div className="flex justify-around text-zinc-400">
            <span>Owner: <b className="text-white">1234</b></span>
            <span>Cashier: <b className="text-white">2222</b></span>
            <span>Waiter: <b className="text-white">3333</b></span>
            <span>Kitchen: <b className="text-white">4444</b></span>
          </div>
        </div>
      </div>
    </div>
  );
};
