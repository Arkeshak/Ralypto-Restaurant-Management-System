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

  http.post('*/menu/items', async ({ request }) => {
    const data = (await request.json()) as any;
    const newItem = {
      id: `item-${Date.now()}`,
      ...data,
    };
    MOCK_MENU_ITEMS.push(newItem);
    return HttpResponse.json(newItem, { status: 201 });
  }),

  http.patch('*/menu/items/:id', async ({ params, request }) => {
    const { id } = params;
    const updates = (await request.json()) as any;
    const item = MOCK_MENU_ITEMS.find((i) => i.id === id);
    if (!item) {
      return HttpResponse.json({ code: 'NOT_FOUND', message: 'Item not found' }, { status: 404 });
    }
    Object.assign(item, updates);
    return HttpResponse.json(item);
  }),
];
