import { authHandlers } from './auth.handlers';
import { menuHandlers } from './menu.handlers';
import { tablesHandlers } from './tables.handlers';
import { ordersHandlers } from './orders.handlers';
import { kitchenHandlers } from './kitchen.handlers';
import { shiftsHandlers } from './shifts.handlers';
import { subscriptionHandlers } from './subscription.handlers';
import { reportsHandlers } from './reports.handlers';
import { reservationsHandlers } from './reservations.handlers';

export const handlers = [
  ...authHandlers,
  ...menuHandlers,
  ...tablesHandlers,
  ...ordersHandlers,
  ...kitchenHandlers,
  ...shiftsHandlers,
  ...subscriptionHandlers,
  ...reportsHandlers,
  ...reservationsHandlers,
];
