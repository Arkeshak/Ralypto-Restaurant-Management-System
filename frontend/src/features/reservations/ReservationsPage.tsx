import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Users,
  Clock,
  Phone,
  Plus,
  CheckCircle2,
  XCircle,
  UserCheck,
  BellRing,
  Bot,
  Filter,
  RefreshCw,
  Search,
} from 'lucide-react';
import { reservationsApi } from '../../api/endpoints/reservations';
import { tablesApi } from '../../api/endpoints/tables';
import type { Reservation, WaitlistEntry, Table } from '../../api/types';
import { toast } from 'sonner';

export const ReservationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'timeline' | 'waitlist'>('bookings');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [tables, setTables] = useState<Table[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // New Reservation Modal state
  const [isNewBookingOpen, setIsNewBookingOpen] = useState<boolean>(false);
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>('');
  const [newPartySize, setNewPartySize] = useState<number>(2);
  const [newTime, setNewTime] = useState<string>(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 60);
    return d.toISOString().slice(0, 16);
  });
  const [newTableId, setNewTableId] = useState<string>('');
  const [newSpecialRequests, setNewSpecialRequests] = useState<string>('');

  // New Waitlist Modal state
  const [isNewWaitlistOpen, setIsNewWaitlistOpen] = useState<boolean>(false);
  const [waitlistName, setWaitlistName] = useState<string>('');
  const [waitlistPhone, setWaitlistPhone] = useState<string>('');
  const [waitlistPartySize, setWaitlistPartySize] = useState<number>(2);
  const [waitlistEstMinutes, setWaitlistEstMinutes] = useState<number>(15);
  const [waitlistNotes, setWaitlistNotes] = useState<string>('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [resList, wlList, tblList] = await Promise.all([
        reservationsApi.getReservations(),
        reservationsApi.getWaitlist(),
        tablesApi.getTables(),
      ]);
      setReservations(resList);
      setWaitlist(wlList);
      setTables(tblList);
    } catch (err: any) {
      setError(err?.message || 'Failed to load reservations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actions
  const handleUpdateStatus = async (
    id: string,
    status: Reservation['status'],
    tableId?: string,
    tableNumber?: string
  ) => {
    try {
      await reservationsApi.updateReservationStatus(id, status, tableId);
      setReservations((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status, ...(tableNumber ? { tableNumber, tableId } : {}) } : r
        )
      );
      toast.success(`Reservation marked as ${status}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update reservation');
    }
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
      toast.error('Customer name and phone number are required');
      return;
    }

    try {
      const selectedTbl = tables.find((t) => t.id === newTableId);
      const created = await reservationsApi.createReservation({
        customerName: newCustomerName,
        customerPhone: newCustomerPhone,
        partySize: newPartySize,
        reservationTime: new Date(newTime).toISOString(),
        tableId: newTableId || undefined,
        tableNumber: selectedTbl?.number || undefined,
        specialRequests: newSpecialRequests || undefined,
        source: 'staff',
      });

      setReservations((prev) => [created, ...prev]);
      setIsNewBookingOpen(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewSpecialRequests('');
      toast.success('Reservation created successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create reservation');
    }
  };

  const handleAddToWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistName.trim() || !waitlistPhone.trim()) {
      toast.error('Customer name and phone are required');
      return;
    }

    try {
      const created = await reservationsApi.addToWaitlist({
        customerName: waitlistName,
        customerPhone: waitlistPhone,
        partySize: waitlistPartySize,
        estimatedWaitMinutes: waitlistEstMinutes,
        notes: waitlistNotes || undefined,
      });

      setWaitlist((prev) => [...prev, created]);
      setIsNewWaitlistOpen(false);
      setWaitlistName('');
      setWaitlistPhone('');
      setWaitlistNotes('');
      toast.success('Party added to waitlist');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add to waitlist');
    }
  };

  const handleNotifyWaitlist = async (id: string) => {
    try {
      await reservationsApi.updateWaitlistStatus(id, 'notified');
      setWaitlist((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status: 'notified', notifiedAt: new Date().toISOString() } : w))
      );
      toast.success('SMS notification sent to guest: Table ready!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send notification');
    }
  };

  const handleSeatWaitlist = async (entry: WaitlistEntry) => {
    try {
      await reservationsApi.updateWaitlistStatus(entry.id, 'seated');
      setWaitlist((prev) => prev.map((w) => (w.id === entry.id ? { ...w, status: 'seated' } : w)));
      toast.success(`${entry.customerName} seated`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update waitlist status');
    }
  };

  // Filtered reservations
  const filteredReservations = reservations.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.customerName.toLowerCase().includes(q) ||
        r.customerPhone.includes(q) ||
        (r.tableNumber && r.tableNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Metrics
  const totalBookings = reservations.length;
  const totalGuests = reservations.reduce((sum, r) => sum + r.partySize, 0);
  const seatedCount = reservations.filter((r) => r.status === 'seated').length;
  const activeWaitlistCount = waitlist.filter((w) => w.status === 'waiting').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Reservations & Waitlist</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
              Live Flow
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Table bookings, walk-in waitlist queue, and AI Voice Agent reservations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsNewWaitlistOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-400" />
            <span>Add to Waitlist</span>
          </button>
          <button
            type="button"
            onClick={() => setIsNewBookingOpen(true)}
            className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Reservation</span>
          </button>
        </div>
      </div>

      {/* Hero AI Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-brand-950/30 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              AI Voice Booking Agent
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider">Online</span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Customers can book via web widget, WhatsApp, or voice. AI verifies table capacity and drafts bookings automatically.
            </p>
          </div>
        </div>
        <div className="text-xs text-zinc-400 self-end sm:self-center font-mono">
          Strict Rule: AI never overbooks free tables.
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Bookings Today</span>
            <Calendar className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-black text-white mt-1 font-mono">{totalBookings}</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Guests Expected</span>
            <Users className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-black text-white mt-1 font-mono">{totalGuests}</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Currently Seated</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">{seatedCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Waitlist Queue</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-1 font-mono">{activeWaitlistCount}</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'bookings'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            Today's Bookings ({reservations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'timeline'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            Timeline by Table
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('waitlist')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'waitlist'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <span>Waitlist Queue</span>
            {activeWaitlistCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] flex items-center justify-center font-bold">
                {activeWaitlistCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'bookings' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search guest or table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              />
            </div>
            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              <Filter className="w-3.5 h-3.5 text-zinc-500 ml-1.5" />
              {['all', 'confirmed', 'seated', 'pending'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-colors ${
                    statusFilter === st
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main View Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-zinc-900/40 rounded-2xl animate-pulse border border-zinc-800/40" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <p className="text-sm font-semibold">{error}</p>
          <button
            type="button"
            onClick={fetchData}
            className="mt-3 px-4 py-2 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl text-xs font-bold"
          >
            Retry Loading
          </button>
        </div>
      ) : activeTab === 'bookings' ? (
        /* Today's Bookings List */
        filteredReservations.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-zinc-900/20 border border-zinc-800/40">
            <Calendar className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No reservations found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              No bookings match the selected filter. Create a manual reservation or let the AI Voice Booking Agent take inbound requests.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReservations.map((res) => {
              const resDate = new Date(res.reservationTime);
              const timeStr = resDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              const sourceBadge = {
                voice_agent: { label: 'Voice Agent', color: 'bg-brand-500/10 text-brand-400 border-brand-500/30' },
                whatsapp: { label: 'WhatsApp', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
                web: { label: 'Web Widget', color: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
                staff: { label: 'Staff POS', color: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
                phone: { label: 'Phone', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
              }[res.source] || { label: res.source, color: 'bg-zinc-800 text-zinc-300 border-zinc-700' };

              const statusBadge = {
                confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                seated: 'bg-brand-500/10 text-brand-400 border-brand-500/30',
                pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                no_show: 'bg-red-500/10 text-red-400 border-red-500/30',
                cancelled: 'bg-zinc-800 text-zinc-400 border-zinc-700',
                completed: 'bg-zinc-800 text-zinc-400 border-zinc-700',
              }[res.status];

              return (
                <div
                  key={res.id}
                  className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start md:items-center gap-4">
                    {/* Time slot pill */}
                    <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-zinc-400 mb-0.5" />
                      <span className="text-xs font-bold text-white font-mono">{timeStr}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-base font-bold text-white">{res.customerName}</span>
                        <span className="text-xs text-zinc-400 font-mono flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {res.partySize} guests
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge} capitalize`}>
                          {res.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sourceBadge.color}`}>
                          {sourceBadge.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-zinc-500" />
                          {res.customerPhone}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-zinc-300">
                          {res.tableNumber ? `Assigned to ${res.tableNumber}` : 'Table unassigned'}
                        </span>
                      </div>

                      {res.specialRequests && (
                        <p className="text-xs text-amber-400/90 italic flex items-center gap-1 pt-0.5">
                          <span>Note:</span> "{res.specialRequests}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {res.status !== 'seated' && res.status !== 'cancelled' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(res.id, 'seated', res.tableId || 'table-001', res.tableNumber || 'Table 1')}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Seat Guest</span>
                      </button>
                    )}

                    {res.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(res.id, 'confirmed')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm</span>
                      </button>
                    )}

                    {res.status !== 'no_show' && res.status !== 'cancelled' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(res.id, 'no_show')}
                        className="px-3 py-1.5 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-medium transition-colors"
                      >
                        No-Show
                      </button>
                    )}

                    {res.status !== 'cancelled' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(res.id, 'cancelled')}
                        className="p-1.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                        title="Cancel Booking"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : activeTab === 'timeline' ? (
        /* Timeline View By Table */
        <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800 overflow-x-auto">
          <div className="min-w-[700px] space-y-4">
            <div className="grid grid-cols-8 gap-2 text-xs font-mono font-semibold text-zinc-400 pb-2 border-b border-zinc-800">
              <div>Table</div>
              <div>12:00 PM</div>
              <div>01:00 PM</div>
              <div>02:00 PM</div>
              <div>06:00 PM</div>
              <div>07:00 PM</div>
              <div>08:00 PM</div>
              <div>09:00 PM</div>
            </div>

            {tables.map((table) => {
              const tableRes = reservations.filter((r) => r.tableId === table.id && r.status !== 'cancelled');

              return (
                <div key={table.id} className="grid grid-cols-8 gap-2 items-center py-2.5 border-b border-zinc-800/40">
                  <div className="font-bold text-xs text-white">
                    {table.number}
                    <div className="text-[10px] text-zinc-500 font-normal">{table.capacity} seats</div>
                  </div>

                  {/* 7 Time Slots */}
                  {[12, 13, 14, 18, 19, 20, 21].map((hour) => {
                    const match = tableRes.find((r) => new Date(r.reservationTime).getHours() === hour);

                    return (
                      <div key={hour} className="h-10 rounded-xl flex items-center justify-center text-xs">
                        {match ? (
                          <div
                            className={`w-full h-full rounded-xl p-1.5 text-[10px] font-semibold flex flex-col justify-center overflow-hidden border ${
                              match.status === 'seated'
                                ? 'bg-brand-500/20 text-brand-300 border-brand-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}
                            title={`${match.customerName} (${match.partySize} pax)`}
                          >
                            <span className="truncate">{match.customerName}</span>
                            <span className="text-zinc-400 font-mono">{match.partySize} pax</span>
                          </div>
                        ) : (
                          <div className="w-full h-full rounded-xl bg-zinc-900/40 border border-zinc-800/40 flex items-center justify-center text-zinc-600 text-[10px]">
                            Free
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Waitlist Queue Tab */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-400">
              Walk-in guests waiting for tables. Automated SMS alerts are sent when their table is ready.
            </p>
            <button
              type="button"
              onClick={() => setIsNewWaitlistOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Guest</span>
            </button>
          </div>

          {waitlist.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-zinc-900/20 border border-zinc-800/40">
              <Clock className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white">Waitlist is clear</h3>
              <p className="text-xs text-zinc-500 mt-1">All arriving walk-in guests have been accommodated.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {waitlist.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center">
                      <span className="text-xs font-bold text-amber-400 font-mono">
                        {entry.estimatedWaitMinutes}m
                      </span>
                      <span className="text-[9px] text-zinc-500 uppercase">Wait</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{entry.customerName}</span>
                        <span className="text-xs text-zinc-400 font-mono">({entry.partySize} guests)</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            entry.status === 'notified'
                              ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                              : entry.status === 'seated'
                              ? 'bg-brand-500/10 text-brand-400 border-brand-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {entry.status}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-zinc-500" />
                          {entry.customerPhone}
                        </span>
                        {entry.notes && <span className="italic text-zinc-500">• "{entry.notes}"</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {entry.status === 'waiting' && (
                      <button
                        type="button"
                        onClick={() => handleNotifyWaitlist(entry.id)}
                        className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <BellRing className="w-3.5 h-3.5" />
                        <span>Send SMS Alert</span>
                      </button>
                    )}
                    {entry.status !== 'seated' && (
                      <button
                        type="button"
                        onClick={() => handleSeatWaitlist(entry)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Seat Now</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Reservation Modal Dialog */}
      {isNewBookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white tracking-tight mb-1">Create Reservation</h3>
            <p className="text-xs text-zinc-400 mb-5">Manual booking confirmation by staff or manager.</p>

            <form onSubmit={handleCreateReservation} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kasun Bandara"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300">Customer Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +94 77 123 4567"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300">Party Size</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={newPartySize}
                    onChange={(e) => setNewPartySize(parseInt(e.target.value, 10) || 1)}
                    className="w-full mt-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">Assign Table</label>
                  <select
                    value={newTableId}
                    onChange={(e) => setNewTableId(e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  >
                    <option value="">Auto-assign later</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.number} ({t.capacity} seats)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300">Date & Time</label>
                <input
                  type="datetime-local"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300">Special Requests / Occasion</label>
                <input
                  type="text"
                  placeholder="e.g. Anniversary dinner, window view"
                  value={newSpecialRequests}
                  onChange={(e) => setNewSpecialRequests(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewBookingOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  Confirm Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Waitlist Entry Dialog */}
      {isNewWaitlistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white tracking-tight mb-1">Add to Waitlist</h3>
            <p className="text-xs text-zinc-400 mb-5">Register walk-in party awaiting open table.</p>

            <form onSubmit={handleAddToWaitlist} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sanath Jayasuriya"
                  value={waitlistName}
                  onChange={(e) => setWaitlistName(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300">Phone for SMS Alert *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +94 77 333 4455"
                  value={waitlistPhone}
                  onChange={(e) => setWaitlistPhone(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300">Party Size</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={waitlistPartySize}
                    onChange={(e) => setWaitlistPartySize(parseInt(e.target.value, 10) || 1)}
                    className="w-full mt-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">Estimated Wait (min)</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={waitlistEstMinutes}
                    onChange={(e) => setWaitlistEstMinutes(parseInt(e.target.value, 10) || 15)}
                    className="w-full mt-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300">Notes (location/booth)</label>
                <input
                  type="text"
                  placeholder="e.g. Waiting in bar lounge"
                  value={waitlistNotes}
                  onChange={(e) => setWaitlistNotes(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewWaitlistOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  Add to Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationsPage;
