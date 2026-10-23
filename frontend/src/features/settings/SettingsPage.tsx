import { Settings, Printer, KeyRound } from 'lucide-react';
import { BigButton } from '../../components/common/BigButton';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl glass-card border border-zinc-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-2xl bg-brand-950/80 text-brand-500 border border-brand-800/60">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">System & Outlet Settings</h1>
            <p className="text-sm text-zinc-400">
              Restaurant profile, thermal printers, tax rates, and staff PIN credentials
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl glass-panel border border-zinc-800 space-y-4">
        <h3 className="text-lg font-bold text-zinc-200">Settings Configuration Modules:</h3>
        <ul className="space-y-3 text-sm text-zinc-300">
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs mt-0.5">1</span>
            <span><strong>Receipt & Kitchen Printers:</strong> Configure ESC/POS thermal printers via Network IP or direct USB.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs mt-0.5">2</span>
            <span><strong>Taxes & Service Charges:</strong> Set standard Sri Lankan 10% service charge and VAT/SSCL toggles.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs mt-0.5">3</span>
            <span><strong>Staff PIN Management:</strong> Issue and reset 4-digit numeric floor PINs for cashiers and waiters.</span>
          </li>
        </ul>

        <div className="pt-4 border-t border-zinc-800 flex gap-3">
          <BigButton variant="brand" icon={<Printer className="w-4 h-4" />}>
            Configure ESC/POS Printers
          </BigButton>
          <BigButton variant="secondary" icon={<KeyRound className="w-4 h-4" />}>
            Staff PIN Directory
          </BigButton>
        </div>
      </div>
    </div>
  );
};
