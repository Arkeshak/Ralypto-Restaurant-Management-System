import type {
  User,
  Restaurant,
  Category,
  MenuItem,
  Table,
  Order,
  KitchenTicket,
  Shift,
  Reservation,
  WaitlistEntry,
} from '../../api/types';

export const MOCK_RESTAURANT: Restaurant = {
  id: 'rest-cey-101',
  name: 'Ceylon Spice Bistro',
  code: 'CEY101',
  currency: 'LKR',
  taxRate: 0.0,
  serviceChargeRate: 0.1,
};

export const MOCK_USERS: Record<string, { user: User; pin: string; password: string }> = {
  owner: {
    pin: '1111',
    password: 'pass123',
    user: {
      id: 'usr-owner-01',
      email: 'owner@ralypto.com',
      firstName: 'Arkesh',
      lastName: 'Fernando',
      role: 'owner',
      restaurantId: 'rest-cey-101',
    },
  },
  manager: {
    pin: '2222',
    password: 'pass123',
    user: {
      id: 'usr-mgr-01',
      email: 'manager@ralypto.com',
      firstName: 'Kamal',
      lastName: 'Silva',
      role: 'manager',
      restaurantId: 'rest-cey-101',
    },
  },
  cashier: {
    pin: '3333',
    password: 'pass123',
    user: {
      id: 'usr-cashier-01',
      email: 'cashier@ralypto.com',
      firstName: 'Dinesh',
      lastName: 'Perera',
      role: 'cashier',
      restaurantId: 'rest-cey-101',
    },
  },
  waiter: {
    pin: '4444',
    password: 'pass123',
    user: {
      id: 'usr-waiter-01',
      email: 'waiter@ralypto.com',
      firstName: 'Ruwan',
      lastName: 'Silva',
      role: 'waiter',
      restaurantId: 'rest-cey-101',
    },
  },
  kitchen: {
    pin: '5555',
    password: 'pass123',
    user: {
      id: 'usr-kitchen-01',
      email: 'kitchen@ralypto.com',
      firstName: 'Bandara',
      lastName: 'Wijekoon',
      role: 'kitchen',
      restaurantId: 'rest-cey-101',
    },
  },
};

export const MOCK_PLANS: Record<string, { id: string; code: 'basic' | 'standard' | 'premium'; name: string; monthlyPriceCents: number }> = {
  basic: {
    id: 'plan-basic',
    code: 'basic',
    name: 'Basic Plan',
    monthlyPriceCents: 1250000,
  },
  standard: {
    id: 'plan-standard',
    code: 'standard',
    name: 'Standard Plan',
    monthlyPriceCents: 2450000,
  },
  premium: {
    id: 'plan-premium',
    code: 'premium',
    name: 'Premium Plan',
    monthlyPriceCents: 4950000,
  },
};

let currentMockPlanCode: 'basic' | 'standard' | 'premium' = 'standard';

export function setMockRestaurantPlan(code: 'basic' | 'standard' | 'premium') {
  if (MOCK_PLANS[code]) {
    currentMockPlanCode = code;
  }
}

export function getMockRestaurantPlan() {
  return MOCK_PLANS[currentMockPlanCode] || MOCK_PLANS.standard;
}

export function getMockPlanCode(): 'basic' | 'standard' | 'premium' {
  return currentMockPlanCode;
}

export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'cat-rice-kottu',
    name: 'Rice & Kottu',
    icon: 'Utensils',
    sortOrder: 1,
    targetStation: 'kitchen',
  },
  {
    id: 'cat-starters',
    name: 'Short Eats & Starters',
    icon: 'Flame',
    sortOrder: 2,
    targetStation: 'kitchen',
  },
  {
    id: 'cat-beverages',
    name: 'Beverages & Juices',
    icon: 'Coffee',
    sortOrder: 3,
    targetStation: 'bar',
  },
  {
    id: 'cat-desserts',
    name: 'Sri Lankan Desserts',
    icon: 'Cake',
    sortOrder: 4,
    targetStation: 'kitchen',
  },
];

export const MOCK_MENU_ITEMS: MenuItem[] = [
  {
    id: 'item-kottu-chick',
    categoryId: 'cat-rice-kottu',
    name: 'Chicken Kottu',
    description: 'Fresh shredded godamba roti tossed with chicken breast, eggs, leeks and rich curry gravy',
    priceCents: 145000,
    costCents: 62000,
    imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&auto=format&fit=crop&q=80',
    isVeg: false,
    isSpicy: true,
    isAvailable: true,
    aliases: ['chicken kottu', 'kottu', 'kothu', 'chicken kothu', 'kottu ekak', 'චිකන් කොත්තු', 'කොත්තු', 'கொத்து'],
    modifiers: [
      { id: 'mod-extra-cheese', name: 'Add Extra Melted Cheese', priceDeltaCents: 35000 },
      { id: 'mod-extra-roti', name: 'Large Double Portion', priceDeltaCents: 45000 },
    ],
  },
  {
    id: 'item-kottu-cheese',
    categoryId: 'cat-rice-kottu',
    name: 'Special Cheese Kottu',
    description: 'Creamy mozzarella and cheddar blended hot chicken kottu',
    priceCents: 185000,
    costCents: 85000,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    isVeg: false,
    isSpicy: true,
    isAvailable: true,
    aliases: ['cheese kottu', 'special cheese kottu', 'cheese kothu', 'චීස් කොත්තු', 'சீஸ் கொத்து'],
  },
  {
    id: 'item-fried-rice-sea',
    categoryId: 'cat-rice-kottu',
    name: 'Seafood Fried Rice',
    description: 'Basmati wok-fried with jumbo prawns, calamari rings, spring onion and chili paste',
    priceCents: 160000,
    costCents: 72000,
    imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80',
    isVeg: false,
    isSpicy: true,
    isAvailable: true,
    aliases: ['seafood fried rice', 'seafood rice', 'seafood bath', 'සීෆුඩ් රයිස්', 'கடல் உணவு சாதம்'],
  },
  {
    id: 'item-fried-rice-veg',
    categoryId: 'cat-rice-kottu',
    name: 'Vegetable Fried Rice',
    description: 'Wok tossed fresh bell peppers, carrots, sweet corn and cashew nuts',
    priceCents: 115000,
    costCents: 42000,
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isSpicy: false,
    isAvailable: true,
    aliases: ['vegetable fried rice', 'veg fried rice', 'veg rice', 'vegetable rice', 'එළවළු බත්', 'වෙජි රයිස්', 'காய்கறி சாதம்'],
  },
  {
    id: 'item-starter-hbc',
    categoryId: 'cat-starters',
    name: 'Hot Butter Cuttlefish (HBC)',
    description: 'Crispy batter squid tossed with chili butter, capsicum rings and dried chili flakes',
    priceCents: 220000,
    costCents: 98000,
    imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80',
    isVeg: false,
    isSpicy: true,
    isAvailable: true,
    aliases: ['hot butter cuttlefish', 'hbc', 'cuttlefish', 'crispy cuttlefish', 'දැල්ලෝ', 'ஹாட் பட்டர் கணவாய்'],
  },
  {
    id: 'item-starter-dev-chick',
    categoryId: 'cat-starters',
    name: 'Devilled Chicken (Sweet & Spicy)',
    description: 'Crispy fried boneless chicken glazed with tomato, capsicum, red onion and crushed chili',
    priceCents: 150000,
    costCents: 65000,
    imageUrl: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=600&auto=format&fit=crop&q=80',
    isVeg: false,
    isSpicy: true,
    isAvailable: true,
    aliases: ['devilled chicken', 'devil chicken', 'chilli chicken', 'චිකන් ඩෙවිල්', 'டெவில்ட் சிக்கன்'],
  },
  {
    id: 'item-bev-lime-juice',
    categoryId: 'cat-beverages',
    name: 'Fresh Lime Juice (Ice & Mint)',
    description: 'Freshly squeezed local kaffir lime with mint sprig and crushed ice',
    priceCents: 45000,
    costCents: 12000,
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isSpicy: false,
    isAvailable: true,
    aliases: ['lime juice', 'fresh lime juice', 'lime drink', 'දෙහි ජූස්', 'දෙහි යුෂ', 'எலுமிச்சை சாறு'],
  },
  {
    id: 'item-bev-falooda',
    categoryId: 'cat-beverages',
    name: 'Royal Falooda with Ice Cream',
    description: 'Rose syrup, basil seeds, vermicelli, chilled milk topped with vanilla ice cream',
    priceCents: 65000,
    costCents: 24000,
    imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isSpicy: false,
    isAvailable: true,
    aliases: ['falooda', 'royal falooda', 'ice cream falooda', 'ෆලූඩා', 'பலுடா'],
  },
  {
    id: 'item-dessert-watalappan',
    categoryId: 'cat-desserts',
    name: 'Traditional Watalappan',
    description: 'Steamed coconut custard pudding made with kithul jaggery, cardamom and toasted cashews',
    priceCents: 55000,
    costCents: 18000,
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isSpicy: false,
    isAvailable: true,
    aliases: ['watalappan', 'watalappam', 'jaggery pudding', 'වටලප්පන්', 'வட்டலப்பம்'],
  },
];

export const MOCK_TABLES: Table[] = [
  {
    id: 'table-001',
    number: 'Table 1',
    areaName: 'Ground Floor',
    capacity: 2,
    status: 'available',
    activeOrderId: null,
    activeOrderTotalCents: null,
  },
  {
    id: 'table-002',
    number: 'Table 2',
    areaName: 'Ground Floor',
    capacity: 4,
    status: 'occupied',
    activeOrderId: 'ord-1002',
    activeOrderTotalCents: 385000,
  },
  {
    id: 'table-003',
    number: 'Table 3',
    areaName: 'Ground Floor',
    capacity: 4,
    status: 'available',
    activeOrderId: null,
    activeOrderTotalCents: null,
  },
  {
    id: 'table-004',
    number: 'Table 4',
    areaName: 'Terrace Garden',
    capacity: 6,
    status: 'reserved',
    activeOrderId: null,
    activeOrderTotalCents: null,
  },
  {
    id: 'table-005',
    number: 'Table 5',
    areaName: 'AC Dining Hall',
    capacity: 4,
    status: 'occupied',
    activeOrderId: 'ord-1005',
    activeOrderTotalCents: 379500,
  },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-1005',
    orderNumber: 'ORD-1005',
    tableId: 'table-005',
    tableNumber: 'Table 5',
    orderType: 'dine_in',
    status: 'preparing',
    items: [
      {
        id: 'item-ord-01',
        menuItemId: 'item-kottu-chick',
        name: 'Chicken Kottu',
        quantity: 2,
        unitPriceCents: 145000,
        subtotalCents: 290000,
        notes: 'Extra spicy, extra gravy',
        status: 'preparing',
      },
      {
        id: 'item-ord-02',
        menuItemId: 'item-bev-lime-juice',
        name: 'Fresh Lime Juice (Ice & Mint)',
        quantity: 2,
        unitPriceCents: 45000,
        subtotalCents: 90000,
        notes: 'Less sugar',
        status: 'ready',
      },
    ],
    subtotalCents: 380000,
    discountCents: 0,
    taxCents: 0,
    serviceChargeCents: 38000,
    totalCents: 418000,
    clientCreatedUuid: '550e8400-e29b-41d4-a716-446655440000',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
];

export const MOCK_KITCHEN_TICKETS: KitchenTicket[] = [
  {
    id: 'kot-042',
    orderId: 'ord-1005',
    orderNumber: 'ORD-1005',
    ticketNumber: 'KOT-042',
    tableNumber: 'Table 5',
    station: 'kitchen',
    status: 'preparing',
    items: [
      {
        name: 'Chicken Kottu',
        quantity: 2,
        notes: 'Extra spicy, gravy on side',
      },
    ],
    firedAt: new Date(Date.now() - 12 * 60000).toISOString(),
    elapsedMinutes: 12,
  },
  {
    id: 'kot-043',
    orderId: 'ord-1005',
    orderNumber: 'ORD-1005',
    ticketNumber: 'BOT-018',
    tableNumber: 'Table 5',
    station: 'bar',
    status: 'ready',
    items: [
      {
        name: 'Fresh Lime Juice',
        quantity: 2,
        notes: 'Less sugar, mint sprig',
      },
    ],
    firedAt: new Date(Date.now() - 10 * 60000).toISOString(),
    elapsedMinutes: 10,
  },
];

export const MOCK_SHIFT: Shift = {
  id: 'shift-morning-01',
  openedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  closedAt: null,
  openingFloatCents: 1000000, // LKR 10,000.00
  cashSalesCents: 14500000, // LKR 145,000.00
  cardSalesCents: 13950000, // LKR 139,500.00
  expectedCashCents: 15500000, // LKR 155,000.00
  status: 'open',
};

// Initial Mock Reservations
export let MOCK_RESERVATIONS: Reservation[] = [
  {
    id: 'res-001',
    restaurantId: 'rest-cey-101',
    customerName: 'Nimal Senanayake',
    customerPhone: '+94 77 123 4567',
    customerEmail: 'nimal@senanayake.lk',
    partySize: 4,
    reservationTime: new Date(Date.now() + 30 * 60000).toISOString(), // in 30 mins
    durationMinutes: 90,
    tableId: 'table-004',
    tableNumber: 'Table 4',
    status: 'confirmed',
    source: 'voice_agent',
    specialRequests: 'Birthday celebration, prefers quiet booth',
    createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
  },
  {
    id: 'res-002',
    restaurantId: 'rest-cey-101',
    customerName: 'Fatima Razik',
    customerPhone: '+94 71 987 6543',
    customerEmail: 'fatima@razik.org',
    partySize: 2,
    reservationTime: new Date(Date.now() + 90 * 60000).toISOString(), // in 1.5 hours
    durationMinutes: 60,
    tableId: 'table-003',
    tableNumber: 'Table 3',
    status: 'confirmed',
    source: 'whatsapp',
    specialRequests: 'Window seat if available, strictly halal items',
    createdAt: new Date(Date.now() - 180 * 60000).toISOString(),
  },
  {
    id: 'res-003',
    restaurantId: 'rest-cey-101',
    customerName: 'Samantha Gunasekera',
    customerPhone: '+94 76 555 4321',
    customerEmail: 'sam@gcorporate.lk',
    partySize: 6,
    reservationTime: new Date(Date.now() - 45 * 60000).toISOString(), // 45 mins ago
    durationMinutes: 120,
    tableId: 'table-005',
    tableNumber: 'Table 5',
    status: 'seated',
    source: 'web',
    specialRequests: 'Client dinner, high chairs for 1 toddler',
    createdAt: new Date(Date.now() - 300 * 60000).toISOString(),
  },
  {
    id: 'res-004',
    restaurantId: 'rest-cey-101',
    customerName: 'Rohan Jayasuriya',
    customerPhone: '+94 70 333 8899',
    customerEmail: 'rohan.j@gmail.com',
    partySize: 3,
    reservationTime: new Date(Date.now() + 180 * 60000).toISOString(),
    durationMinutes: 90,
    tableId: null,
    tableNumber: null,
    status: 'pending',
    source: 'voice_agent',
    specialRequests: 'Asked via Voice Booking Agent: "Table for 3 around 8pm"',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
];

// Initial Mock Waitlist
export let MOCK_WAITLIST: WaitlistEntry[] = [
  {
    id: 'wait-001',
    restaurantId: 'rest-cey-101',
    customerName: 'Dilshan Weerasinghe',
    customerPhone: '+94 77 999 1122',
    partySize: 2,
    estimatedWaitMinutes: 15,
    status: 'waiting',
    notes: 'Walk-in, waiting outside near fountain',
    joinedAt: new Date(Date.now() - 10 * 60000).toISOString(),
  },
  {
    id: 'wait-002',
    restaurantId: 'rest-cey-101',
    customerName: 'Priya Sundaram',
    customerPhone: '+94 75 444 3322',
    partySize: 4,
    estimatedWaitMinutes: 25,
    status: 'notified',
    notes: 'Notified via SMS, walking over from car park',
    joinedAt: new Date(Date.now() - 22 * 60000).toISOString(),
    notifiedAt: new Date(Date.now() - 2 * 60000).toISOString(),
  },
];

export function getMockReservations() {
  return MOCK_RESERVATIONS;
}

export function setMockReservations(res: Reservation[]) {
  MOCK_RESERVATIONS = res;
}

export function getMockWaitlist() {
  return MOCK_WAITLIST;
}

export function setMockWaitlist(list: WaitlistEntry[]) {
  MOCK_WAITLIST = list;
}

