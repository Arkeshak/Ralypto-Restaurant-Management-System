import { Boxes, PackagePlus, History } from 'lucide-react';
import { BigButton } from '../../components/common/BigButton';

export const InventoryPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl glass-card border border-zinc-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-2xl bg-brand-950/80 text-brand-500 border border-brand-800/60">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Inventory, GRN & Recipe Costing</h1>
            <p className="text-sm text-zinc-400">
              Raw materials, supplier purchasing, low stock alerts, and automatic order depletion
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl glass-panel border border-zinc-800 space-y-4">
        <h3 className="text-lg font-bold text-zinc-200">Inventory Features & Roadmap:</h3>
        <ul className="space-y-3 text-sm text-zinc-300">
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs mt-0.5">1</span>
            <span><strong>Goods Received Notes (GRN):</strong> Record supplier purchase orders, quantities, unit prices, and batch expiry.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs mt-0.5">2</span>
            <span><strong>Recipe Bill of Materials (BOM):</strong> Map 1 Kottu &rarr; 180g Chopped Roti, 120g Chicken, 1 Egg, 30g Leeks.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs mt-0.5">3</span>
            <span><strong>Automated Order Depletion:</strong> Real-time deduction of raw stock when orders are completed.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs mt-0.5">4</span>
            <span><strong>Wastage & Spoilage Auditing:</strong> Log dropped, burnt, or expired ingredients with cost impact analysis.</span>
          </li>
        </ul>

        <div className="pt-4 border-t border-zinc-800 flex gap-3">
          <BigButton variant="brand" icon={<PackagePlus className="w-4 h-4" />}>
            Create New GRN
          </BigButton>
          <BigButton variant="secondary" icon={<History className="w-4 h-4" />}>
            Stock Movement History
          </BigButton>
        </div>
      </div>
    </div>
  );
};
