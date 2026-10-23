import { apiClient } from '../client';
import type {
  Reservation,
  CreateReservationDto,
  ReservationStatus,
  WaitlistEntry,
  CreateWaitlistDto,
  WaitlistStatus,
} from '../types';

export const reservationsApi = {
  getReservations: (params?: { date?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return apiClient<Reservation[]>(`/reservations${qs ? `?${qs}` : ''}`);
  },

  createReservation: (data: CreateReservationDto) =>
    apiClient<Reservation>('/reservations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateReservationStatus: (id: string, status: ReservationStatus, tableId?: string) =>
    apiClient<Reservation>(`/reservations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, tableId }),
    }),

  deleteReservation: (id: string) =>
    apiClient<{ success: boolean }>(`/reservations/${id}`, {
      method: 'DELETE',
    }),

  getWaitlist: () => apiClient<WaitlistEntry[]>('/waitlist'),

  addToWaitlist: (data: CreateWaitlistDto) =>
    apiClient<WaitlistEntry>('/waitlist', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateWaitlistStatus: (id: string, status: WaitlistStatus) =>
    apiClient<WaitlistEntry>(`/waitlist/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteWaitlistEntry: (id: string) =>
    apiClient<{ success: boolean }>(`/waitlist/${id}`, {
      method: 'DELETE',
    }),
};
