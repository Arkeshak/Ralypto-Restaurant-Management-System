import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@fontsource-variable/inter';
import '@fontsource/noto-sans-sinhala';
import '@fontsource/noto-sans-tamil';
import './styles/globals.css';

async function prepareApp() {
  // MSW is ONLY imported and started if in dev mode with mocks explicitly enabled
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true') {
    const { enableMocking } = await import('./mocks/browser');
    await enableMocking();
  }
}

prepareApp().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
