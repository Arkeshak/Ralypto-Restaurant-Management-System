import { http, HttpResponse } from 'msw';
import {
  getMockReservations,
  setMockReservations,
  getMockWaitlist,
  setMockWaitlist,
} from '../data/mockData';
import type { Reservation, WaitlistEntry, CreateReservationDto, CreateWaitlistDto } from '../../api/types';

export const reservationsHandlers = [
  // List reservations (with optional ?status= or ?date=)
  http.get('*/reservations', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    let list = getMockReservations();
    if (status && status !== 'all') {
      list = list.filter((r) => r.status === status);
    }
    return HttpResponse.json(list);
  }),

  // Create reservation
  http.post('*/reservations', async ({ request }) => {
    const body = (await request.json()) as CreateReservationDto;
    const newReservation: Reservation = {
      id: `res-${Date.now().toString(36)}`,
      restaurantId: 'rest-cey-101',
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerEmail: body.customerEmail || null,
      partySize: body.partySize,
      reservationTime: body.reservationTime,
      durationMinutes: body.durationMinutes || 90,
      tableId: body.tableId || null,
      tableNumber: body.tableNumber || null,
      status: 'confirmed',
      source: body.source || 'staff',
      specialRequests: body.specialRequests || null,
      createdAt: new Date().toISOString(),
    };

    const current = getMockReservations();
    setMockReservations([newReservation, ...current]);
    return HttpResponse.json(newReservation, { status: 201 });
  }),

  // Update reservation status (and optionally assign table)
  http.patch('*/reservations/:id/status', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as { status: Reservation['status']; tableId?: string; tableNumber?: string };
    const list = getMockReservations();
    const idx = list.findIndex((r) => r.id === id);

    if (idx === -1) {
      return HttpResponse.json({ code: 'RESERVATION_NOT_FOUND', message: 'Reservation not found' }, { status: 404 });
    }

    const updated: Reservation = {
      ...list[idx],
      status: body.status,
      ...(body.tableId !== undefined ? { tableId: body.tableId } : {}),
      ...(body.tableNumber !== undefined ? { tableNumber: body.tableNumber } : {}),
    };

    const nextList = [...list];
    nextList[idx] = updated;
    setMockReservations(nextList);

    return HttpResponse.json(updated);
  }),

  // Delete reservation
  http.delete('*/reservations/:id', ({ params }) => {
    const { id } = params;
    const list = getMockReservations();
    setMockReservations(list.filter((r) => r.id !== id));
    return HttpResponse.json({ success: true });
  }),

  // List waitlist entries
  http.get('*/waitlist', () => {
    return HttpResponse.json(getMockWaitlist());
  }),

  // Add to waitlist
  http.post('*/waitlist', async ({ request }) => {
    const body = (await request.json()) as CreateWaitlistDto;
    const newEntry: WaitlistEntry = {
      id: `wait-${Date.now().toString(36)}`,
      restaurantId: 'rest-cey-101',
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      partySize: body.partySize,
      estimatedWaitMinutes: body.estimatedWaitMinutes || 15,
      status: 'waiting',
      notes: body.notes || null,
      joinedAt: new Date().toISOString(),
    };

    const current = getMockWaitlist();
    setMockWaitlist([...current, newEntry]);
    return HttpResponse.json(newEntry, { status: 201 });
  }),

  // Update waitlist entry status
  http.patch('*/waitlist/:id/status', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as { status: WaitlistEntry['status'] };
    const list = getMockWaitlist();
    const idx = list.findIndex((w) => w.id === id);

    if (idx === -1) {
      return HttpResponse.json({ code: 'WAITLIST_NOT_FOUND', message: 'Waitlist entry not found' }, { status: 404 });
    }

    const updated: WaitlistEntry = {
      ...list[idx],
      status: body.status,
      ...(body.status === 'notified' ? { notifiedAt: new Date().toISOString() } : {}),
    };

    const nextList = [...list];
    nextList[idx] = updated;
    setMockWaitlist(nextList);

    return HttpResponse.json(updated);
  }),

  // Delete waitlist entry
  http.delete('*/waitlist/:id', ({ params }) => {
    const { id } = params;
    const list = getMockWaitlist();
    setMockWaitlist(list.filter((w) => w.id !== id));
    return HttpResponse.json({ success: true });
  }),
];
