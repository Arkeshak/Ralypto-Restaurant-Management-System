import { apiClient } from '../client';
import type { Table, TableStatus } from '../types';

export const tablesApi = {
  getTables: () => apiClient<Table[]>('/tables'),

  createTable: (data: { number: string; capacity: number; areaName?: string }) =>
    apiClient<Table>('/tables', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: TableStatus) =>
    apiClient<Table>(`/tables/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
