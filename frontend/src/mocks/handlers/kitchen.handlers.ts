import { http, HttpResponse } from 'msw';
import { MOCK_KITCHEN_TICKETS } from '../data/mockData';

let tickets = [...MOCK_KITCHEN_TICKETS];

export const kitchenHandlers = [
  http.get('*/kitchen/orders', ({ request }) => {
    const url = new URL(request.url);
    const station = url.searchParams.get('station');
    if (station) {
      return HttpResponse.json(tickets.filter((t) => t.station === station));
    }
    return HttpResponse.json(tickets);
  }),

  http.patch('*/kitchen/tickets/:id/status', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as { status: any };

    const ticketIndex = tickets.findIndex((t) => t.id === id);
    if (ticketIndex > -1) {
      tickets[ticketIndex] = { ...tickets[ticketIndex], status: body.status };
      return HttpResponse.json(tickets[ticketIndex]);
    }

    return HttpResponse.json({ code: 'TICKET_NOT_FOUND', message: 'Ticket not found' }, { status: 404 });
  }),
];
