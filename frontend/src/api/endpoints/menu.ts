import { apiClient } from '../client';
import type { Category, MenuItem } from '../types';

export const menuApi = {
  getCategories: () => apiClient<Category[]>('/menu/categories'),

  createCategory: (data: { name: string; targetStation: 'kitchen' | 'bar'; icon?: string }) =>
    apiClient<Category>('/menu/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getItems: (params?: { categoryId?: string; search?: string }) =>
    apiClient<MenuItem[]>('/menu/items', { params }),

  createItem: (data: Partial<MenuItem>) =>
    apiClient<MenuItem>('/menu/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
