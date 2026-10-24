import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  KeyRound,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  X,
  Sparkles,
  Phone,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { BigButton } from '@/components/common/BigButton';
import { useAuth } from '@/hooks/useAuth';
import { useReadOnly } from '@/hooks/useReadOnly';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';

export interface StaffMember {
  id: string;
  name: string;
  role: 'owner' | 'manager' | 'cashier' | 'waiter' | 'kitchen' | 'accountant';
  phone: string;
  pin: string;
  isActive: boolean;
  isOwner?: boolean;
}

export function StaffPage() {
  const { plan } = useAuth();
  const { isReadOnly, preventInReadOnly } = useReadOnly();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<'manager' | 'cashier' | 'waiter' | 'kitchen' | 'accountant'>('waiter');
  const [formPhone, setFormPhone] = useState('');
  const [formPin, setFormPin] = useState('');
  const loadStaff = async () => setStaffList(await apiClient<StaffMember[]>('/staff'));
  useEffect(() => { void loadStaff().catch(() => toast.error('Could not load staff directory')); }, []);

  // Plan limits: Basic has 3 users max
  const isBasic = plan?.code === 'basic';
  const maxStaffCount = isBasic ? 3 : 999;
  const isLimitReached = staffList.length >= maxStaffCount;

  const handleOpenAdd = () => {
    if (isReadOnly) {
      toast.error('Action blocked: Your account is in Read-Only mode. Please renew your plan.');
      return;
    }
    if (isLimitReached) {
      toast.error('User limit reached for Basic Plan. Upgrade to add more staff.');
      return;
    }
    setEditingStaff(null);
    setFormName('');
    setFormRole('waiter');
    setFormPhone('');
    setFormPin('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff: StaffMember) => {
    if (isReadOnly) {
      toast.error('Action blocked: Your account is in Read-Only mode. Please renew your plan.');
      return;
    }
    setEditingStaff(staff);
    setFormName(staff.name);
    setFormRole(staff.role as any);
    setFormPhone(staff.phone);
    setFormPin('');
    setIsModalOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      toast.error('Action blocked: Your account is in Read-Only mode. Please renew your plan.');
      return;
    }
    if (!formName.trim()) {
      toast.error('Please enter the employee name');
      return;
    }
    if ((!editingStaff || formPin) && (formPin.length !== 4 || !/^\d{4}$/.test(formPin))) {
      toast.error('Staff PIN must be exactly 4 digits');
      return;
    }

    try {
      const payload = { name: formName.trim(), ...(!editingStaff?.isOwner ? { role: formRole } : {}), phone: formPhone.trim(), ...(formPin ? { pin: formPin } : {}) };
      if (editingStaff) await apiClient(`/staff/${editingStaff.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      else await apiClient('/staff', { method: 'POST', body: JSON.stringify(payload) });
      await loadStaff(); setIsModalOpen(false); toast.success(editingStaff ? `Updated details for ${formName}` : `Added ${formName} to the team`);
    } catch { toast.error('Could not save staff member'); }
  };

  const handleToggleActive = async (staff: StaffMember) => {
    if (isReadOnly) {
      toast.error('Action blocked: Your account is in Read-Only mode. Please renew your plan.');
      return;
    }
    if (staff.isOwner) {
      toast.error('The primary account owner cannot be deactivated');
      return;
    }
    try { await apiClient(`/staff/${staff.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !staff.isActive }) }); await loadStaff(); toast.info(`${staff.name} is now ${!staff.isActive ? 'Active' : 'Inactive'}`); }
    catch { toast.error('Could not update staff status'); }
  };

  const handleDeleteStaff = async (staff: StaffMember) => {
    if (isReadOnly) {
      toast.error('Action blocked: Your account is in Read-Only mode. Please renew your plan.');
      return;
    }
    if (staff.isOwner) {
      toast.error('The account owner cannot be deleted');
      return;
    }
    try { await apiClient(`/staff/${staff.id}`, { method: 'DELETE' }); await loadStaff(); toast.success(`Deactivated ${staff.name}`); }
    catch { toast.error('Could not deactivate staff member'); }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 border border-purple-500/30">Owner</span>;
      case 'manager':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 border border-blue-500/30">Manager</span>;
      case 'cashier':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">Cashier</span>;
      case 'waiter':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30">Waiter</span>;
      case 'kitchen':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/30">Kitchen Chef</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted/20 text-muted">{role}</span>;
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <PageHeader
        title="Staff & Permissions"
        description="Manage restaurant team members, assign terminal PINs, and configure roles."
        action={{
          label: "Add Staff Member",
          icon: Plus,
          onClick: preventInReadOnly(handleOpenAdd),
          disabled: isLimitReached || isReadOnly,
        }}
      />

      {/* Basic Plan Limit Banner / Upgrade Card */}
      {isBasic && (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500 text-surface flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text">
                Basic Plan Capacity: {staffList.length} of 3 users used
              </h4>
              <p className="text-xs text-muted">
                {isLimitReached
                  ? 'User capacity reached. Upgrade to Standard for unlimited staff accounts.'
                  : `${3 - staffList.length} user slots remaining on your current subscription.`}
              </p>
            </div>
          </div>
          <Link
            to="/subscription"
            className="px-4 py-2.5 rounded-2xl bg-brand text-surface text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-95 transition-all shrink-0"
          >
            Upgrade to Standard
          </Link>
        </div>
      )}

      {/* Staff Table / Cards */}
      <div className="rounded-3xl border border-border bg-surface shadow-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted" />
            <h3 className="font-bold text-sm text-text">Team Directory</h3>
          </div>
          <span className="text-xs text-muted font-semibold">
            {staffList.filter((s) => s.isActive).length} active of {staffList.length} total
          </span>
        </div>

        <div className="divide-y divide-border">
          {staffList.map((staff) => (
            <div
              key={staff.id}
              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                !staff.isActive ? 'opacity-60 bg-bg/40' : 'hover:bg-bg/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl border border-border bg-bg flex items-center justify-center text-text font-bold text-sm shrink-0">
                  {staff.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-text">{staff.name}</span>
                    {getRoleBadge(staff.role)}
                    {staff.isOwner && (
                      <span className="text-[10px] font-semibold text-muted bg-surface border border-border px-2 py-0.5 rounded-full">
                        Primary Owner
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted mt-1">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {staff.phone || 'No phone'}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <KeyRound className="h-3 w-3" /> PIN: ••••
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {/* Active switch */}
                <button
                  type="button"
                  onClick={() => handleToggleActive(staff)}
                  disabled={staff.isOwner}
                  title={staff.isOwner ? "Owner cannot be deactivated" : "Toggle active status"}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    staff.isActive
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                      : 'border-border bg-bg text-muted'
                  }`}
                >
                  {staff.isActive ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5" /> Active
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5" /> Inactive
                    </>
                  )}
                </button>

                {/* Edit */}
                <button
                  type="button"
                  onClick={() => handleOpenEdit(staff)}
                  className="h-9 w-9 rounded-xl border border-border bg-surface hover:bg-bg flex items-center justify-center text-muted hover:text-text transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>

                {/* Delete */}
                {!staff.isOwner && (
                  <button
                    type="button"
                    onClick={() => handleDeleteStaff(staff)}
                    className="h-9 w-9 rounded-xl border border-border bg-surface hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-600 flex items-center justify-center text-muted transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-surface border border-border shadow-2xl p-6 text-text">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-text">
                {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-bg flex items-center justify-center text-muted hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted block mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Priyantha Jayasuriya"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-bg text-sm text-text focus:outline-none focus:ring-1 focus:ring-brand"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted block mb-1">Staff Role</label>
                <select
                  disabled={editingStaff?.isOwner}
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-bg text-sm text-text focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  {editingStaff?.isOwner && <option value="owner">Owner</option>}
                  <option value="waiter">Waiter (Floor App & Orders)</option>
                  <option value="cashier">Cashier (POS & Settlements)</option>
                  <option value="manager">Manager (Discounts, Voids, Shifts)</option>
                  <option value="kitchen">Kitchen Chef (KDS Station)</option>
                  <option value="accountant">Accountant (Reports & Expenses)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted block mb-1">Mobile Phone</label>
                <input
                  type="tel"
                  placeholder="e.g. 077 123 4567"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-bg text-sm text-text focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted block mb-1">
                  {editingStaff ? 'New 4-Digit Terminal PIN (optional)' : '4-Digit Terminal Access PIN'}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  value={formPin}
                  onChange={(e) => setFormPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-11 px-3 text-center tracking-widest text-lg font-bold rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-11 rounded-2xl border border-border bg-surface text-text text-xs font-semibold hover:bg-bg"
                >
                  Cancel
                </button>
                <BigButton
                  label={editingStaff ? 'Update Staff' : 'Add Staff'}
                  variant="primary"
                  full
                  type="submit"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default StaffPage;
