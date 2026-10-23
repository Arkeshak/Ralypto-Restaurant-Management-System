import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useUiStore } from '../../stores/ui.store';

export const AppShell: React.FC = () => {
  const { activeManagerPinModal, closeManagerPinModal } = useUiStore();

  return (
    <div className="min-h-screen flex flex-col bg-charcoal text-foreground">
      <TopBar />
      <div className="flex flex-1 relative">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 md:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />

      {/* Global Manager PIN Prompt */}
      <ConfirmDialog
        isOpen={activeManagerPinModal.isOpen}
        title={activeManagerPinModal.title}
        description={activeManagerPinModal.description}
        requiresPin={true}
        onConfirm={(pin) => {
          if (activeManagerPinModal.onSuccess && pin) {
            activeManagerPinModal.onSuccess(pin);
          }
          closeManagerPinModal();
        }}
        onCancel={closeManagerPinModal}
      />
    </div>
  );
};
