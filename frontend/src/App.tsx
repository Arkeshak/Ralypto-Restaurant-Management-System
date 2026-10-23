import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { AppProviders } from './app/providers';
import { initOfflineSync } from './offline/syncQueue';

export function App() {
  useEffect(() => {
    const cleanup = initOfflineSync();
    return cleanup;
  }, []);

  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}

export default App;
