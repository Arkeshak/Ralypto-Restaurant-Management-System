import { Truck } from 'lucide-react';
import { BigButton } from '../../components/common/BigButton';

export const DeliveryPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl glass-card border border-zinc-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-2xl bg-brand-950/80 text-brand-500 border border-brand-800/60">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Delivery Orders & Aggregators</h1>
            <p className="text-sm text-zinc-400">
              Manage incoming delivery orders from Uber Eats, PickMe, and direct phone deliveries
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl glass-panel border border-zinc-800 space-y-4">
        <h3 className="text-lg font-bold text-zinc-200">Delivery Module Capabilities:</h3>
        <ul className="space-y-3 text-sm text-zinc-300">
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs mt-0.5">1</span>
            <span><strong>Manual Aggregator Order Entry:</strong> Quick entry for Uber Eats and PickMe orders with commission separation.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs mt-0.5">2</span>
            <span><strong>Rider Tracking & Dispatch:</strong> Log driver names, vehicle numbers, phone numbers, and dispatch times.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs mt-0.5">3</span>
            <span><strong>Automated KOT Routing:</strong> Deliveries auto-print packing slips with customer delivery address.</span>
          </li>
        </ul>

        <div className="pt-4 border-t border-zinc-800 flex gap-3">
          <BigButton variant="brand" icon={<Truck className="w-4 h-4" />}>
            New Delivery Order
          </BigButton>
        </div>
      </div>
    </div>
  );
};
