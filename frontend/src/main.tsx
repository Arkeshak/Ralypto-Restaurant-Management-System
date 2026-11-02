import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@fontsource-variable/inter';
import '@fontsource/noto-sans-sinhala';
import '@fontsource/noto-sans-tamil';
import './styles/globals.css';

// Opt-in demo helper: with VITE_DEMO_AUTOLOGIN=true the app signs in as the demo
// owner on first load so reviewers land directly in the product. Login, PIN
// login and public QR pages are left alone so roles can still be switched.
async function demoAutoLogin() {
  if (import.meta.env.VITE_DEMO_AUTOLOGIN !== 'true') return;
  if (localStorage.getItem('ralypto_token')) return;
  const path = window.location.pathname;
  if (path.startsWith('/login') || path.startsWith('/pin-login') || path.startsWith('/qr')) return;
  try {
    const [{ authApi }, { useAuthStore }] = await Promise.all([
      import('./api/endpoints/auth'),
      import('./stores/auth.store'),
    ]);
    const res = await authApi.login({ email: 'owner@ralypto.com', password: 'pass123' });
    localStorage.setItem('ralypto_walkthrough_dismissed', 'true');
    useAuthStore.getState().setAuth({
      token: res.accessToken,
      user: res.user,
      restaurant: res.restaurant,
      plan: res.plan,
      featureFlags: res.featureFlags,
    });
  } catch {
    // Fall back to the normal login screen if the demo account is unavailable.
  }
}

async function prepareApp() {
  // Start MSW mock service worker if mock mode is turned on (works in dev & deployed demo)
  if (import.meta.env.VITE_USE_MOCKS !== 'false') {
    const { enableMocking } = await import('./mocks/browser');
    await enableMocking();
  }
  await demoAutoLogin();
}

prepareApp().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
