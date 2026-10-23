import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'auto';

function applyTheme(mode: ThemeMode) {
  let isDark = mode === 'dark';
  if (mode === 'auto') {
    isDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  if (typeof document !== 'undefined') {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
    }
  }
}

const initialMode: ThemeMode =
  (typeof window !== 'undefined' && (localStorage.getItem('ralypto_theme_mode') as ThemeMode)) ||
  'auto';

if (typeof window !== 'undefined') {
  applyTheme(initialMode);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const current = useUiStore.getState().themeMode;
    if (current === 'auto') {
      applyTheme('auto');
    }
  });
}

interface UiState {
  themeMode: ThemeMode;
  theme: 'dark' | 'light';
  isSidebarOpen: boolean;
  isDemoMode: boolean;
  isWalkthroughOpen: boolean;
  activeManagerPinModal: {
    isOpen: boolean;
    title: string;
    description: string;
    onSuccess?: (pin: string) => void;
  };
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  setDemoMode: (enabled: boolean) => void;
  setWalkthroughOpen: (open: boolean) => void;
  openManagerPinModal: (
    title: string,
    description: string,
    onSuccess: (pin: string) => void
  ) => void;
  closeManagerPinModal: () => void;
}

const initialDemoMode =
  typeof window !== 'undefined'
    ? localStorage.getItem('ralypto_demo_mode') === 'true'
    : false;

export const useUiStore = create<UiState>((set) => ({
  themeMode: initialMode,
  theme: initialMode === 'light' ? 'light' : 'dark',
  isSidebarOpen: true,
  isDemoMode: initialDemoMode,
  isWalkthroughOpen: false,
  activeManagerPinModal: {
    isOpen: false,
    title: '',
    description: '',
  },

  setThemeMode: (mode: ThemeMode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ralypto_theme_mode', mode);
    }
    applyTheme(mode);
    set({
      themeMode: mode,
      theme: mode === 'light' ? 'light' : 'dark',
    });
  },

  toggleTheme: () => {
    set((state) => {
      const nextMode: ThemeMode = state.themeMode === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        localStorage.setItem('ralypto_theme_mode', nextMode);
      }
      applyTheme(nextMode);
      return {
        themeMode: nextMode,
        theme: nextMode === 'light' ? 'light' : 'dark',
      };
    });
  },

  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),

  setDemoMode: (enabled: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ralypto_demo_mode', enabled ? 'true' : 'false');
    }
    set({ isDemoMode: enabled });
  },

  setWalkthroughOpen: (open: boolean) => set({ isWalkthroughOpen: open }),

  openManagerPinModal: (title, description, onSuccess) =>
    set({
      activeManagerPinModal: {
        isOpen: true,
        title,
        description,
        onSuccess,
      },
    }),

  closeManagerPinModal: () =>
    set({
      activeManagerPinModal: {
        isOpen: false,
        title: '',
        description: '',
      },
    }),
}));
