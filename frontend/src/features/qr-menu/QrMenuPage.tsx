import { QrCode, Smartphone, Globe } from 'lucide-react';
import { BigButton } from '../../components/common/BigButton';

export const QrMenuPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl glass-card border border-zinc-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-2xl bg-brand-950/80 text-brand-500 border border-brand-800/60">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">QR Digital Menu & Self-Order</h1>
            <p className="text-sm text-zinc-400">
              Zero-friction customer dining web app with multi-lingual support
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl glass-panel border border-zinc-800 space-y-4">
        <h3 className="text-lg font-bold text-zinc-200">Customer QR Experience Roadmap:</h3>
        <ul className="space-y-3 text-sm text-zinc-300">
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs mt-0.5">1</span>
            <span><strong>Instant Table QR:</strong> Scannable table stickers routing directly to <code>/public/menu/CEY101/5</code>.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs mt-0.5">2</span>
            <span><strong>Tri-Lingual Localization:</strong> Instant toggle between English, Sinhala (සිංහල), and Tamil (தமிழ்).</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs mt-0.5">3</span>
            <span><strong>Self-Ordering & KDS Link:</strong> Customers add items to cart and dispatch directly to kitchen tickets.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs mt-0.5">4</span>
            <span><strong>Instant Waiter Calling:</strong> Digital buzzer notifying floor staff with table number and request type.</span>
          </li>
        </ul>

        <div className="pt-4 border-t border-zinc-800 flex gap-3">
          <BigButton variant="brand" icon={<Smartphone className="w-4 h-4" />}>
            Preview Table 5 Customer View
          </BigButton>
          <BigButton variant="secondary" icon={<Globe className="w-4 h-4" />}>
            Download Table QR PDFs
          </BigButton>
        </div>
      </div>
    </div>
  );
};
