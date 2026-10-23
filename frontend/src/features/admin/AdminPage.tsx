import { ShieldCheck, Building2, Activity } from 'lucide-react';
import { BigButton } from '../../components/common/BigButton';

export const AdminPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl glass-card border border-zinc-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-2xl bg-sky-950/80 text-sky-400 border border-sky-800/60">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Super Admin SaaS Control Plane</h1>
            <p className="text-sm text-zinc-400">
              Multi-tenant platform oversight, restaurant subscriptions, and tenant onboarding
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl glass-panel border border-zinc-800 space-y-4">
        <h3 className="text-lg font-bold text-zinc-200">Platform Management Roadmap:</h3>
        <ul className="space-y-3 text-sm text-zinc-300">
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs mt-0.5">1</span>
            <span><strong>Tenant Provisioning:</strong> Instant tenant onboarding generating restaurant codes and initial admin accounts.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs mt-0.5">2</span>
            <span><strong>Subscription & Grace Period Overrides:</strong> Manual override of 7-day grace periods and lock status.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs mt-0.5">3</span>
            <span><strong>Global System Health:</strong> Monitor database transaction latency and active WebSocket connections.</span>
          </li>
        </ul>

        <div className="pt-4 border-t border-zinc-800 flex gap-3">
          <BigButton variant="brand" icon={<Building2 className="w-4 h-4" />}>
            Provision New Tenant
          </BigButton>
          <BigButton variant="secondary" icon={<Activity className="w-4 h-4" />}>
            Platform Audit Logs
          </BigButton>
        </div>
      </div>
    </div>
  );
};
