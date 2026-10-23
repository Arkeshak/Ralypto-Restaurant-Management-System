import React, { useState } from 'react';
import { BigButton } from './BigButton';
import { AlertTriangle, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requiresPin) {
      if (!pin || pin.length !== 4) {
        setError('Please enter a 4-digit Manager PIN');
        return;
      }
    }
    onConfirm(pin);
    setPin('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 overflow-hidden rounded-2xl glass-panel border border-zinc-800 shadow-2xl">
        <div className="flex items-start gap-4 mb-4">
          <div
            className={`p-3 rounded-xl ${
              isDestructive
                ? 'bg-red-950/80 text-red-500 border border-red-900/50'
                : 'bg-brand-950/80 text-brand-500 border border-brand-900/50'
            }`}
          >
            {requiresPin ? <Lock className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-100">{title}</h3>
            <p className="mt-1 text-sm text-zinc-400">{description}</p>
          </div>
        </div>

        {requiresPin && (
          <div className="my-5 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Manager Authorization PIN
            </label>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              placeholder="••••"
              className="w-full h-12 px-4 text-center tracking-[1em] text-2xl font-mono rounded-lg bg-zinc-950 border border-zinc-700 text-white focus:outline-none focus:border-brand-500"
              autoFocus
            />
            {error && <p className="mt-1.5 text-xs text-red-400 font-medium">{error}</p>}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <BigButton
            variant="outline"
            fullWidth
            onClick={() => {
              setPin('');
              setError('');
              onCancel();
            }}
          >
            {cancelLabel || t('common.cancel')}
          </BigButton>
          <BigButton
            variant={isDestructive ? 'destructive' : 'brand'}
            fullWidth
            onClick={handleConfirm}
          >
            {confirmLabel || t('common.confirm')}
          </BigButton>
        </div>
      </div>
    </div>
  );
};
