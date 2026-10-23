import { create } from 'zustand';

interface UiState {
  theme: 'dark' | 'light';
  isSidebarOpen: boolean;
  activeManagerPinModal: {
    isOpen: boolean;
    title: string;
    description: string;
    onSuccess?: (pin: string) => void;
  };
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  openManagerPinModal: (
    title: string,
    description: string,
    onSuccess: (pin: string) => void
  ) => void;
  closeManagerPinModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  theme: 'dark',
  isSidebarOpen: true,
  activeManagerPinModal: {
    isOpen: false,
    title: '',
    description: '',
  },

  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
      return { theme: nextTheme };
    });
  },

  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),

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
