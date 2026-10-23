import { http, HttpResponse } from 'msw';
import { MOCK_CATEGORIES, MOCK_MENU_ITEMS } from '../data/mockData';

export const menuHandlers = [
  http.get('*/menu/categories', () => {
    return HttpResponse.json(MOCK_CATEGORIES);
  }),

  http.get('*/menu/items', ({ request }) => {
    const url = new URL(request.url);
    const categoryId = url.searchParams.get('categoryId');
    const search = url.searchParams.get('search')?.toLowerCase();

    let filtered = [...MOCK_MENU_ITEMS];
    if (categoryId) {
      filtered = filtered.filter((i) => i.categoryId === categoryId);
    }
    if (search) {
      filtered = filtered.filter(
        (i) =>
          i.name.toLowerCase().includes(search) ||
          i.description.toLowerCase().includes(search)
      );
    }

    return HttpResponse.json(filtered);
  }),
];
