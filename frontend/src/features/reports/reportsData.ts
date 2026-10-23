export interface ReportMeta {
  id: string;
  title: string;
  category: 'sales' | 'items' | 'staff' | 'money' | 'stock';
  description: string;
  minPlan: 'basic' | 'standard' | 'premium';
  hasChart?: boolean;
}

export const REPORTS_REGISTRY: ReportMeta[] = [
  // 1. Sales Group
  {
    id: 'daily_sales',
    title: '1. Daily Sales Summary',
    category: 'sales',
    description: 'Day-by-day revenue breakdown including gross, taxes, discounts and net totals.',
    minPlan: 'basic',
    hasChart: true,
  },
  {
    id: 'sales_by_hour',
    title: '2. Sales by Hour (Rush Analysis)',
    category: 'sales',
    description: 'Hourly order volume and revenue curves to identify lunch and dinner peak rushes.',
    minPlan: 'basic',
    hasChart: true,
  },
  {
    id: 'sales_by_table',
    title: '6. Sales by Table & Area',
    category: 'sales',
    description: 'Turnover rates, guest counts, and revenue contribution per dining table.',
    minPlan: 'basic',
  },

  // 2. Items Group
  {
    id: 'sales_by_item',
    title: '3. Sales by Item (Product Mix)',
    category: 'items',
    description: 'Complete breakdown of all dishes sold with units, prices and total revenues.',
    minPlan: 'basic',
  },
  {
    id: 'sales_by_category',
    title: '4. Sales by Category',
    category: 'items',
    description: 'Category revenue share across Kottu, Starters, Beverages, and Desserts.',
    minPlan: 'basic',
    hasChart: true,
  },
  {
    id: 'top_bottom_items',
    title: '12. Top & Bottom Items (Velocity)',
    category: 'items',
    description: 'Best-selling star dishes vs slow-moving inventory candidates.',
    minPlan: 'basic',
  },

  // 3. Staff Group
  {
    id: 'sales_by_staff',
    title: '5. Sales by Staff Member',
    category: 'staff',
    description: 'Total revenue and orders processed per waiter and cashier terminal.',
    minPlan: 'basic',
  },
  {
    id: 'shift_summary',
    title: '11. Shift Summary & Cash Drawer',
    category: 'staff',
    description: 'Opening float, counted cash, payment method breakdown, and drawer variance.',
    minPlan: 'basic',
  },

  // 4. Money Group
  {
    id: 'payment_methods',
    title: '7. Payment Methods Breakdown',
    category: 'money',
    description: 'Tender totals across Cash, Card (Visa/Mastercard), LankaQR, and Split payments.',
    minPlan: 'basic',
    hasChart: true,
  },
  {
    id: 'tax_service_summary',
    title: '8. Tax & Service Charge Summary',
    category: 'money',
    description: 'Audit report of 10% Service Charge and 10% Government taxes collected.',
    minPlan: 'basic',
  },
  {
    id: 'discounts_given',
    title: '9. Discounts Given & Authorizations',
    category: 'money',
    description: 'Audit log of promotional discounts, reasons, and approving manager PINs.',
    minPlan: 'standard', // Locked on Basic plan (sees 10)
  },
  {
    id: 'voids_refunds',
    title: '10. Voids & Refunds Audit Log',
    category: 'money',
    description: 'Full security log of canceled tickets and refunded bills with manager approval.',
    minPlan: 'standard', // Locked on Basic plan (sees 10)
  },
];

// Mock data generators for the 12 reports
export const MOCK_REPORTS_DATA = {
  daily_sales: [
    { date: '2026-10-23 (Today)', orders: 48, grossCents: 14500000, discountCents: 450000, serviceCents: 1405000, taxCents: 1405000, netCents: 16860000 },
    { date: '2026-10-22 (Yesterday)', orders: 62, grossCents: 18200000, discountCents: 600000, serviceCents: 1760000, taxCents: 1760000, netCents: 21120000 },
    { date: '2026-10-21', orders: 55, grossCents: 16100000, discountCents: 320000, serviceCents: 1578000, taxCents: 1578000, netCents: 18936000 },
    { date: '2026-10-20', orders: 42, grossCents: 12400000, discountCents: 200000, serviceCents: 1220000, taxCents: 1220000, netCents: 14640000 },
    { date: '2026-10-19', orders: 74, grossCents: 22800000, discountCents: 850000, serviceCents: 2195000, taxCents: 2195000, netCents: 26340000 },
    { date: '2026-10-18', orders: 81, grossCents: 25400000, discountCents: 920000, serviceCents: 2448000, taxCents: 2448000, netCents: 29376000 },
    { date: '2026-10-17', orders: 69, grossCents: 20500000, discountCents: 500000, serviceCents: 2000000, taxCents: 2000000, netCents: 24000000 },
  ],

  sales_by_hour: [
    { hour: '11:00 AM', orders: 4, totalCents: 980000, avgCents: 245000 },
    { hour: '12:00 PM', orders: 12, totalCents: 3850000, avgCents: 320833 },
    { hour: '01:00 PM', orders: 18, totalCents: 6420000, avgCents: 356666 },
    { hour: '02:00 PM', orders: 8, totalCents: 2450000, avgCents: 306250 },
    { hour: '03:00 PM', orders: 3, totalCents: 850000, avgCents: 283333 },
    { hour: '04:00 PM', orders: 5, totalCents: 1200000, avgCents: 240000 },
    { hour: '05:00 PM', orders: 7, totalCents: 2100000, avgCents: 300000 },
    { hour: '06:00 PM', orders: 14, totalCents: 5400000, avgCents: 385714 },
    { hour: '07:00 PM', orders: 24, totalCents: 9850000, avgCents: 410416 },
    { hour: '08:00 PM', orders: 28, totalCents: 11450000, avgCents: 408928 },
    { hour: '09:00 PM', orders: 20, totalCents: 7900000, avgCents: 395000 },
    { hour: '10:00 PM', orders: 6, totalCents: 1950000, avgCents: 325000 },
  ],

  sales_by_item: [
    { name: 'Chicken Kottu', category: 'Rice & Kottu', units: 86, priceCents: 145000, totalCents: 12470000 },
    { name: 'Special Cheese Kottu', category: 'Rice & Kottu', units: 64, priceCents: 185000, totalCents: 11840000 },
    { name: 'Hot Butter Cuttlefish (HBC)', category: 'Short Eats & Starters', units: 52, priceCents: 220000, totalCents: 11440000 },
    { name: 'Seafood Fried Rice', category: 'Rice & Kottu', units: 48, priceCents: 160000, totalCents: 7680000 },
    { name: 'Devilled Chicken', category: 'Short Eats & Starters', units: 38, priceCents: 150000, totalCents: 5700000 },
    { name: 'Fresh Lime Juice', category: 'Beverages', units: 72, priceCents: 45000, totalCents: 3240000 },
    { name: 'Royal Falooda', category: 'Beverages', units: 44, priceCents: 65000, totalCents: 2860000 },
    { name: 'Vegetable Fried Rice', category: 'Rice & Kottu', units: 24, priceCents: 115000, totalCents: 2760000 },
    { name: 'Traditional Watalappan', category: 'Desserts', units: 36, priceCents: 55000, totalCents: 1980000 },
  ],

  sales_by_category: [
    { category: 'Rice & Kottu', itemsCount: 4, unitsSold: 222, totalCents: 34750000, sharePercent: '58.2%' },
    { category: 'Short Eats & Starters', itemsCount: 2, unitsSold: 90, totalCents: 17140000, sharePercent: '28.7%' },
    { category: 'Beverages & Juices', itemsCount: 2, unitsSold: 116, totalCents: 6100000, sharePercent: '10.2%' },
    { category: 'Sri Lankan Desserts', itemsCount: 1, unitsSold: 36, totalCents: 1980000, sharePercent: '3.3%' },
  ],

  sales_by_staff: [
    { staff: 'Dinesh Perera', role: 'Cashier', orders: 124, totalCents: 38500000, avgTicketCents: 310483 },
    { staff: 'Ruwan Silva', role: 'Waiter', orders: 86, totalCents: 26800000, avgTicketCents: 311627 },
    { staff: 'Samantha Wijesinghe', role: 'Waiter', orders: 78, totalCents: 24100000, avgTicketCents: 308974 },
    { staff: 'Kamal Silva', role: 'Manager', orders: 22, totalCents: 8900000, avgTicketCents: 404545 },
  ],

  sales_by_table: [
    { table: 'Table 1', area: 'Inside', orders: 18, guests: 34, totalCents: 5850000, avgTurnMinutes: 38 },
    { table: 'Table 2', area: 'Inside', orders: 24, guests: 72, totalCents: 8900000, avgTurnMinutes: 42 },
    { table: 'Table 3', area: 'Inside', orders: 20, guests: 80, totalCents: 9400000, avgTurnMinutes: 48 },
    { table: 'Table 4', area: 'Inside', orders: 16, guests: 48, totalCents: 6200000, avgTurnMinutes: 35 },
    { table: 'Table 5', area: 'Outside', orders: 22, guests: 66, totalCents: 8100000, avgTurnMinutes: 44 },
    { table: 'Table 6', area: 'Outside', orders: 19, guests: 42, totalCents: 6750000, avgTurnMinutes: 40 },
    { table: 'Table 7', area: 'Rooftop', orders: 28, guests: 98, totalCents: 12400000, avgTurnMinutes: 52 },
    { table: 'Table 8', area: 'Rooftop', orders: 25, guests: 88, totalCents: 11150000, avgTurnMinutes: 50 },
  ],

  payment_methods: [
    { method: 'Cash', count: 142, totalCents: 38900000, sharePercent: '46.5%' },
    { method: 'Visa / Mastercard', count: 118, totalCents: 34500000, sharePercent: '41.2%' },
    { method: 'LankaQR / Digital', count: 32, totalCents: 8200000, sharePercent: '9.8%' },
    { method: 'Split (Cash + Card)', count: 12, totalCents: 2150000, sharePercent: '2.5%' },
  ],

  tax_service_summary: [
    { date: '2026-10-23', netSalesCents: 14050000, serviceCents: 1405000, taxCents: 1405000, totalCents: 16860000 },
    { date: '2026-10-22', netSalesCents: 17600000, serviceCents: 1760000, taxCents: 1760000, totalCents: 21120000 },
    { date: '2026-10-21', netSalesCents: 15780000, serviceCents: 1578000, taxCents: 1578000, totalCents: 18936000 },
    { date: '2026-10-20', netSalesCents: 12200000, serviceCents: 1220000, taxCents: 1220000, totalCents: 14640000 },
    { date: '2026-10-19', netSalesCents: 21950000, serviceCents: 2195000, taxCents: 2195000, totalCents: 26340000 },
  ],

  discounts_given: [
    { orderId: 'ORD-1089', time: '13:42', type: 'Percentage (10%)', reason: 'VIP Regular Customer', authorizedBy: 'Kamal (Manager)', amountCents: 38500 },
    { orderId: 'ORD-1094', time: '15:10', type: 'Fixed (Rs. 500)', reason: 'Staff Family Discount', authorizedBy: 'Arkesh (Owner)', amountCents: 50000 },
    { orderId: 'ORD-1102', time: '19:25', type: 'Percentage (20%)', reason: 'Kitchen Delay Apology', authorizedBy: 'Kamal (Manager)', amountCents: 92000 },
    { orderId: 'ORD-1115', time: '21:05', type: 'Percentage (5%)', reason: 'Promotional Bank Card', authorizedBy: 'Dinesh (Cashier)', amountCents: 24500 },
  ],

  voids_refunds: [
    { orderId: 'ORD-1042', time: '12:15', items: '1x HBC, 1x Lime Juice', reason: 'Customer changed mind before fire', authorizedBy: 'Kamal (PIN 2222)', cashier: 'Dinesh', amountCents: 265000 },
    { orderId: 'ORD-1077', time: '18:40', items: '2x Seafood Fried Rice', reason: 'Allergy requirement noted late', authorizedBy: 'Arkesh (PIN 1111)', cashier: 'Dinesh', amountCents: 320000 },
    { orderId: 'ORD-1098', time: '20:15', items: '1x Royal Falooda', reason: 'Wrong table delivered', authorizedBy: 'Kamal (PIN 2222)', cashier: 'Ruwan', amountCents: 65000 },
  ],

  shift_summary: [
    { shiftId: 'SH-091', cashier: 'Dinesh Perera', opened: 'Today 08:00 AM', closed: 'Active (Now)', floatCents: 1000000, expectedCashCents: 15500000, countedCashCents: 15500000, varianceCents: 0 },
    { shiftId: 'SH-090', cashier: 'Kasun Fernando', opened: 'Yesterday 04:00 PM', closed: 'Yesterday 11:30 PM', floatCents: 1000000, expectedCashCents: 18200000, countedCashCents: 18200000, varianceCents: 0 },
    { shiftId: 'SH-089', cashier: 'Dinesh Perera', opened: 'Yesterday 08:00 AM', closed: 'Yesterday 04:00 PM', floatCents: 1000000, expectedCashCents: 12400000, countedCashCents: 12350000, varianceCents: -50000 },
  ],

  top_bottom_items: [
    { rank: '#1 Best Seller', name: 'Chicken Kottu', category: 'Rice & Kottu', unitsSold: 86, totalRevenueCents: 12470000, margin: '57.2%' },
    { rank: '#2 Best Seller', name: 'Special Cheese Kottu', category: 'Rice & Kottu', unitsSold: 64, totalRevenueCents: 11840000, margin: '54.0%' },
    { rank: '#3 Best Seller', name: 'Hot Butter Cuttlefish (HBC)', category: 'Starters', unitsSold: 52, totalRevenueCents: 11440000, margin: '55.4%' },
    { rank: '#4 Best Seller', name: 'Fresh Lime Juice', category: 'Beverages', unitsSold: 72, totalRevenueCents: 3240000, margin: '73.3%' },
    { rank: '#8 Slow Moving', name: 'Vegetable Fried Rice', category: 'Rice & Kottu', unitsSold: 24, totalRevenueCents: 2760000, margin: '63.5%' },
    { rank: '#9 Slow Moving', name: 'Traditional Watalappan', category: 'Desserts', unitsSold: 36, totalRevenueCents: 1980000, margin: '67.2%' },
  ],
};
