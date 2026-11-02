/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_USE_MOCKS: string;
  readonly VITE_APP_TITLE: string;
  readonly VITE_DEMO_AUTOLOGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
