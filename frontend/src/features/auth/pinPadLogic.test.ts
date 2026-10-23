import { describe, it, expect } from 'vitest';

export function handlePinKey(currentPin: string, key: string): string {
  if (key === 'clear') return '';
  if (key === 'backspace') return currentPin.slice(0, -1);
  if (/^\d$/.test(key) && currentPin.length < 4) {
    return currentPin + key;
  }
  return currentPin;
}

export function validatePin(pin: string, validPins: string[]): { valid: boolean; error?: string } {
  if (pin.length !== 4) {
    return { valid: false, error: 'Please enter a 4-digit PIN.' };
  }
  if (!validPins.includes(pin)) {
    return { valid: false, error: 'Wrong PIN. Try again.' };
  }
  return { valid: true };
}

describe('PIN Pad Logic', () => {
  it('appends numeric digits up to max 4 characters', () => {
    let pin = '';
    pin = handlePinKey(pin, '1');
    expect(pin).toBe('1');
    pin = handlePinKey(pin, '2');
    expect(pin).toBe('12');
    pin = handlePinKey(pin, '3');
    expect(pin).toBe('123');
    pin = handlePinKey(pin, '4');
    expect(pin).toBe('1234');
    // Attempting a 5th digit should be ignored
    pin = handlePinKey(pin, '5');
    expect(pin).toBe('1234');
  });

  it('handles backspace and clear operations', () => {
    let pin = '1234';
    pin = handlePinKey(pin, 'backspace');
    expect(pin).toBe('123');
    pin = handlePinKey(pin, 'backspace');
    expect(pin).toBe('12');
    pin = handlePinKey(pin, 'clear');
    expect(pin).toBe('');
  });

  it('ignores non-numeric characters', () => {
    let pin = '12';
    pin = handlePinKey(pin, 'a');
    expect(pin).toBe('12');
    pin = handlePinKey(pin, '$');
    expect(pin).toBe('12');
  });

  it('validates 4-digit staff PIN with friendly error text', () => {
    const validStaffPins = ['1234', '2222', '3333', '4444'];

    expect(validatePin('2222', validStaffPins)).toEqual({ valid: true });
    expect(validatePin('9999', validStaffPins)).toEqual({
      valid: false,
      error: 'Wrong PIN. Try again.',
    });
    expect(validatePin('12', validStaffPins)).toEqual({
      valid: false,
      error: 'Please enter a 4-digit PIN.',
    });
  });
});
