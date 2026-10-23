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

  http.post('*/tables/move', async ({ request }) => {
    const { sourceTableId, targetTableId } = (await request.json()) as {
      sourceTableId: string;
      targetTableId: string;
    };
    const srcIndex = tables.findIndex((t) => t.id === sourceTableId);
    const tgtIndex = tables.findIndex((t) => t.id === targetTableId);

    if (srcIndex === -1 || tgtIndex === -1) {
      return HttpResponse.json({ code: 'TABLE_NOT_FOUND', message: 'Table not found' }, { status: 404 });
    }

    const source = tables[srcIndex];
    const target = tables[tgtIndex];

    tables[tgtIndex] = {
      ...target,
      status: source.status,
      activeOrderId: source.activeOrderId,
      activeOrderTotalCents: source.activeOrderTotalCents,
    };

    tables[srcIndex] = {
      ...source,
      status: 'available',
      activeOrderId: null,
      activeOrderTotalCents: null,
    };

    return HttpResponse.json({
      success: true,
      sourceTable: tables[srcIndex],
      targetTable: tables[tgtIndex],
    });
  }),

  http.post('*/tables/merge', async ({ request }) => {
    const { sourceTableId, targetTableId } = (await request.json()) as {
      sourceTableId: string;
      targetTableId: string;
      managerPin?: string;
    };
    const srcIndex = tables.findIndex((t) => t.id === sourceTableId);
    const tgtIndex = tables.findIndex((t) => t.id === targetTableId);

    if (srcIndex === -1 || tgtIndex === -1) {
      return HttpResponse.json({ code: 'TABLE_NOT_FOUND', message: 'Table not found' }, { status: 404 });
    }

    const source = tables[srcIndex];
    const target = tables[tgtIndex];
    const mergedTotal = (source.activeOrderTotalCents || 0) + (target.activeOrderTotalCents || 0);

    tables[tgtIndex] = {
      ...target,
      status: 'occupied',
      activeOrderTotalCents: mergedTotal,
    };

    tables[srcIndex] = {
      ...source,
      status: 'available',
      activeOrderId: null,
      activeOrderTotalCents: null,
    };

    return HttpResponse.json({
      success: true,
      sourceTable: tables[srcIndex],
      targetTable: tables[tgtIndex],
      mergedTotalCents: mergedTotal,
    });
  }),
];
