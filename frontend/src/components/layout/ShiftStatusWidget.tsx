import React, { useEffect, useState } from 'react';
import { useShiftStore } from '@/stores/shift.store';
import { MoneyText } from '@/components/common/MoneyText';
import { OpenShiftModal } from '@/features/pos/shifts/OpenShiftModal';
import { CloseShiftModal } from '@/features/pos/shifts/CloseShiftModal';
import { Banknote } from 'lucide-react';

export const ShiftStatusWidget: React.FC = () => {
  const currentShift = useShiftStore((s) => s.currentShift);
  const fetchCurrentShift = useShiftStore((s) => s.fetchCurrentShift);
  const isOpen = useShiftStore((s) => s.isOpen());

  const [isOpenModalActive, setIsOpenModalActive] = useState(false);
  const [isCloseModalActive, setIsCloseModalActive] = useState(false);

  useEffect(() => {
    fetchCurrentShift();
  }, [fetchCurrentShift]);

  const expectedCashCents = currentShift?.expectedCashCents || currentShift?.openingFloatCents || 0;

  return (
    <>
      <button
        onClick={() => {
          if (isOpen) {
            setIsCloseModalActive(true);
          } else {
            setIsOpenModalActive(true);
          }
        }}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-border bg-surface hover:bg-bg transition-colors text-xs font-semibold"
        title={isOpen ? 'Click to view drawer or close shift' : 'Click to open cash drawer shift'}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
          }`}
        />
        <Banknote className="h-3.5 w-3.5 text-muted" />
        {isOpen ? (
          <span className="flex items-center gap-1 text-text">
            <span>Shift Open:</span>
            <span className="font-bold">
              <MoneyText cents={expectedCashCents} />
            </span>
          </span>
        ) : (
          <span className="text-amber-600 font-bold">Shift Closed (Tap to Open)</span>
        )}
      </button>

      {/* Modals */}
      <OpenShiftModal
        isOpen={isOpenModalActive}
        onClose={() => setIsOpenModalActive(false)}
        onSuccess={() => fetchCurrentShift()}
      />

      <CloseShiftModal
        isOpen={isCloseModalActive}
        onClose={() => setIsCloseModalActive(false)}
        onSuccess={() => fetchCurrentShift()}
      />
    </>
  );
};
