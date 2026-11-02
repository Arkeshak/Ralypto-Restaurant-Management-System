import { http, HttpResponse } from 'msw';

// Mock in-memory store for showcase data
let mockInventory = [
  { id: 'stk-1', name: 'Basmati Rice', quantity: 45, unit: 'kg', reorderLevel: 10, supplier: 'Cargills' },
  { id: 'stk-2', name: 'Boneless Chicken', quantity: 28, unit: 'kg', reorderLevel: 8, supplier: 'Bairaha' },
  { id: 'stk-3', name: 'Fresh Cuttlefish', quantity: 15, unit: 'kg', reorderLevel: 5, supplier: 'Negombo Fisheries' },
  { id: 'stk-4', name: 'Mozzarella Cheese', quantity: 12, unit: 'kg', reorderLevel: 4, supplier: 'Pelwatte' },
  { id: 'stk-5', name: 'Cooking Oil', quantity: 50, unit: 'L', reorderLevel: 15, supplier: 'Marina' },
];

let mockDeliveries = [
  { id: 'del-1', customer: 'Dilshan Silva', phone: '0771234567', address: '42 Galle Rd, Colombo 03', amount: 4850, status: 'out_for_delivery', provider: 'PickMe' },
  { id: 'del-2', customer: 'Nimal Perera', phone: '0719876543', address: '15/2 Flower Rd, Colombo 07', amount: 3200, status: 'preparing', provider: 'Uber Eats' },
  { id: 'del-3', customer: 'Anura Fernando', phone: '0765554321', address: '88 Duplication Rd, Colombo 04', amount: 6400, status: 'delivered', provider: 'Direct' },
];

let mockExpenses = [
  { id: 'exp-1', description: 'Vegetable Market Wholesale', category: 'Supplies', amountCents: 4500000, date: '2026-11-01' },
  { id: 'exp-2', description: 'Kitchen Gas Cylinder Refill (x4)', category: 'Utilities', amountCents: 2600000, date: '2026-11-01' },
  { id: 'exp-3', description: 'Staff Daily Meal Allowance', category: 'Payroll', amountCents: 1200000, date: '2026-11-02' },
];

let mockStaff = [
  { id: 'stf-1', name: 'Arkesh Fernando', role: 'owner', phone: '0770000001', pin: '1111', isActive: true, isOwner: true },
  { id: 'stf-2', name: 'Kamal Silva', role: 'manager', phone: '0770000002', pin: '2222', isActive: true },
  { id: 'stf-3', name: 'Saman Kumara', role: 'cashier', phone: '0770000003', pin: '3333', isActive: true },
  { id: 'stf-4', name: 'Nishan Bandara', role: 'waiter', phone: '0770000004', pin: '4444', isActive: true },
  { id: 'stf-5', name: 'Sunil Shantha', role: 'kitchen', phone: '0770000005', pin: '5555', isActive: true },
];

let mockSettings = {
  restName: 'Ceylon Spice Bistro',
  restAddress: 'No. 128 Marine Drive, Colombo 03',
  restPhone: '+94 11 234 5678',
  serviceEnabled: true,
  serviceRate: 10,
  taxEnabled: false,
  taxRate: 0,
  receiptHeader: 'Thank you for dining with Ceylon Spice Bistro!',
  receiptFooter: 'Please visit us again • Wi-Fi: CeylonSpice_Guest',
  showLogoOnReceipt: true,
  allowSelfOrder: true,
};

export const showcaseHandlers = [
  // Inventory
  http.get('*/showcase/inventory', () => HttpResponse.json(mockInventory)),
  http.post('*/showcase/inventory', async ({ request }) => {
    const data = (await request.json()) as any;
    const item = { id: `stk-${Date.now()}`, ...data };
    mockInventory.push(item);
    return HttpResponse.json(item, { status: 201 });
  }),
  http.delete('*/showcase/inventory/:id', ({ params }) => {
    mockInventory = mockInventory.filter((i) => i.id !== params.id);
    return HttpResponse.json({ success: true });
  }),

  // Delivery
  http.get('*/showcase/delivery', () => HttpResponse.json(mockDeliveries)),
  http.post('*/showcase/delivery', async ({ request }) => {
    const data = (await request.json()) as any;
    const item = { id: `del-${Date.now()}`, ...data };
    mockDeliveries.unshift(item);
    return HttpResponse.json(item, { status: 201 });
  }),
  http.patch('*/showcase/delivery/:id', async ({ params, request }) => {
    const updates = (await request.json()) as any;
    const item = mockDeliveries.find((d) => d.id === params.id);
    if (item) Object.assign(item, updates);
    return HttpResponse.json(item || {});
  }),
  http.delete('*/showcase/delivery/:id', ({ params }) => {
    mockDeliveries = mockDeliveries.filter((d) => d.id !== params.id);
    return HttpResponse.json({ success: true });
  }),

  // Accounting
  http.get('*/showcase/accounting', () => HttpResponse.json(mockExpenses)),
  http.post('*/showcase/accounting', async ({ request }) => {
    const data = (await request.json()) as any;
    const item = { id: `exp-${Date.now()}`, ...data, date: new Date().toISOString().slice(0, 10) };
    mockExpenses.unshift(item);
    return HttpResponse.json(item, { status: 201 });
  }),
  http.delete('*/showcase/accounting/:id', ({ params }) => {
    mockExpenses = mockExpenses.filter((e) => e.id !== params.id);
    return HttpResponse.json({ success: true });
  }),

  // Staff
  http.get('*/staff', () => HttpResponse.json(mockStaff)),
  http.post('*/staff', async ({ request }) => {
    const data = (await request.json()) as any;
    const member = { id: `stf-${Date.now()}`, ...data, isActive: true };
    mockStaff.push(member);
    return HttpResponse.json(member, { status: 201 });
  }),
  http.patch('*/staff/:id', async ({ params, request }) => {
    const updates = (await request.json()) as any;
    const member = mockStaff.find((s) => s.id === params.id);
    if (member) Object.assign(member, updates);
    return HttpResponse.json(member || {});
  }),
  http.delete('*/staff/:id', ({ params }) => {
    mockStaff = mockStaff.filter((s) => s.id !== params.id);
    return HttpResponse.json({ success: true });
  }),

  // Settings
  http.get('*/showcase/settings', () => HttpResponse.json([mockSettings])),
  http.post('*/showcase/settings', async ({ request }) => {
    const data = (await request.json()) as any;
    mockSettings = { ...mockSettings, ...data };
    return HttpResponse.json(mockSettings);
  }),

  // Public QR actions
  http.get('*/public/call-waiter', () => HttpResponse.json({ success: true })),
  http.post('*/public/call-waiter', () => HttpResponse.json({ success: true })),
  http.get('*/public/request-bill', () => HttpResponse.json({ success: true })),
  http.post('*/public/request-bill', () => HttpResponse.json({ success: true })),
  http.post('*/public/orders', () => HttpResponse.json({ id: `ord-qr-${Date.now()}`, status: 'received' }, { status: 201 })),
];

