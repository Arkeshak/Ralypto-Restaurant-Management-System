import { Calculator, DollarSign, FileSpreadsheet } from 'lucide-react';
import { BigButton } from '../../components/common/BigButton';

export const AccountingPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl glass-card border border-zinc-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-2xl bg-brand-950/80 text-brand-500 border border-brand-800/60">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Accounting, Expenses & HR/Payroll</h1>
            <p className="text-sm text-zinc-400">
              Double-entry financial reporting, operational expense tracking, and staff payroll
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl glass-panel border border-zinc-800 space-y-4">
        <h3 className="text-lg font-bold text-zinc-200">Accounting & HR Module Scope:</h3>
        <ul className="space-y-3 text-sm text-zinc-300">
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs mt-0.5">1</span>
            <span><strong>Profit & Loss (P&L):</strong> Real-time automated calculation of Gross Sales vs COGS vs Operational Expenses.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs mt-0.5">2</span>
            <span><strong>Expense Management:</strong> Snap receipts and record rent, gas cylinders, utilities, and kitchen repairs.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs mt-0.5">3</span>
            <span><strong>Staff Attendance & Shifts:</strong> Biometric/PIN clock-in tracking with automated overtime calculation.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs mt-0.5">4</span>
            <span><strong>Monthly Payroll:</strong> Base pay, attendance bonuses, advance deductions, and payslip generation.</span>
          </li>
        </ul>

        <div className="pt-4 border-t border-zinc-800 flex gap-3">
          <BigButton variant="brand" icon={<FileSpreadsheet className="w-4 h-4" />}>
            Generate P&L Statement
          </BigButton>
          <BigButton variant="secondary" icon={<DollarSign className="w-4 h-4" />}>
            Record Operational Expense
          </BigButton>
        </div>
      </div>
    </div>
  );
};
