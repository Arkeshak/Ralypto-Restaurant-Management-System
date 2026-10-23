import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kitchenApi } from '../../api/endpoints/kitchen';
import { StatusPill } from '../../components/common/StatusPill';
import { BigButton } from '../../components/common/BigButton';
import { ChefHat, Clock, Check, Utensils, GlassWater } from 'lucide-react';
import type { KitchenTicket } from '../../api/types';

export const KitchenPage: React.FC = () => {
  const [station, setStation] = useState<'kitchen' | 'bar' | 'all'>('all');
  const queryClient = useQueryClient();

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['kitchen-tickets', station],
    queryFn: () => kitchenApi.getTickets(station === 'all' ? undefined : station),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'new' | 'preparing' | 'ready' | 'collected' }) =>
      kitchenApi.updateTicketStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-tickets'] });
    },
  });

  const getNextStatus = (current: string): 'preparing' | 'ready' | 'collected' => {
    if (current === 'new') return 'preparing';
    if (current === 'preparing') return 'ready';
    return 'collected';
  };

  return (
    <div className="space-y-6">
      {/* Header & Station Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-card border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-950/80 text-amber-500 border border-amber-800/60">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Kitchen Display System (KDS)</h1>
            <p className="text-xs text-zinc-400">Live order prep queue & station routing</p>
          </div>
        </div>

        {/* Station Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
          <button
            onClick={() => setStation('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              station === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Stations
          </button>
          <button
            onClick={() => setStation('kitchen')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              station === 'kitchen' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            Kitchen
          </button>
          <button
            onClick={() => setStation('bar')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              station === 'bar' ? 'bg-sky-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <GlassWater className="w-3.5 h-3.5" />
            Bar
          </button>
        </div>
      </div>

      {/* Ticket Board Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-zinc-500">Loading active tickets...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((ticket: KitchenTicket) => {
            const nextStatus = getNextStatus(ticket.status);
            return (
              <div
                key={ticket.id}
                className="flex flex-col justify-between p-5 rounded-2xl glass-panel border border-zinc-800 shadow-xl"
              >
                <div>
                  <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
                    <div>
                      <span className="text-xs font-mono font-bold text-brand-400 uppercase tracking-wider">
                        {ticket.ticketNumber} • {ticket.station}
                      </span>
                      <h3 className="text-xl font-extrabold text-white">{ticket.tableNumber}</h3>
                    </div>
                    <StatusPill status={ticket.status} />
                  </div>

                  <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400 font-mono">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Elapsed: {ticket.elapsedMinutes} mins</span>
                  </div>

                  {/* Items List */}
                  <div className="mt-4 space-y-2.5">
                    {ticket.items.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
                        <div className="flex items-center justify-between font-bold text-sm text-zinc-100">
                          <span>{item.name}</span>
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-brand-400">
                            x{item.quantity}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="mt-1 text-xs text-amber-300 font-medium italic">
                            Note: {item.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-800">
                  <BigButton
                    variant={ticket.status === 'preparing' ? 'success' : 'brand'}
                    size="touch"
                    fullWidth
                    onClick={() => updateStatusMutation.mutate({ id: ticket.id, status: nextStatus })}
                    icon={<Check className="w-4 h-4" />}
                  >
                    Mark as {nextStatus.toUpperCase()}
                  </BigButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
