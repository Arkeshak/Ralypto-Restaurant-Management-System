import { http, HttpResponse } from 'msw';
import { MOCK_TABLES } from '../data/mockData';

let tables = [...MOCK_TABLES];

export const tablesHandlers = [
  http.get('*/tables', () => {
    return HttpResponse.json(tables);
  }),

  http.patch('*/tables/:id/status', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as { status: any };

    const tableIndex = tables.findIndex((t) => t.id === id);
    if (tableIndex > -1) {
      tables[tableIndex] = { ...tables[tableIndex], status: body.status };
      return HttpResponse.json(tables[tableIndex]);
    }

    return HttpResponse.json(
      { code: 'TABLE_NOT_FOUND', message: 'Table not found' },
      { status: 404 }
    );
  }),
];
