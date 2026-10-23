import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

export async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCKS !== 'true') {
    return;
  }

  // Register and start MSW worker
  return worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
  });
}
