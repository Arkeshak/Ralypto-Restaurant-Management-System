import { describe, it, expect } from 'vitest';
import { parseVoiceOrder, extractTableNumber, detectLanguage } from './voiceParser';
import { MOCK_MENU_ITEMS } from '../mocks/data/mockData';

describe('voiceParser', () => {
  it('extracts table number from various spoken patterns', () => {
    expect(extractTableNumber('Table 5, two kottu')).toBe('Table 5');
    expect(extractTableNumber('table no 3 please')).toBe('Table 3');
    expect(extractTableNumber('table two please')).toBe('Table 2');
    expect(extractTableNumber('මේසය 4 එකතු කරන්න')).toBe('Table 4');
  });

  it('detects language accurately', () => {
    expect(detectLanguage('two chicken kottu and one cola')).toBe('en');
    expect(detectLanguage('චිකන් කොත්තු දෙකක්')).toBe('si');
    expect(detectLanguage('kottu dekak spicy karala')).toBe('si'); // Singlish marker
    expect(detectLanguage('இரண்டு கொத்து')).toBe('ta');
  });

  it('parses English voice order with quantities and table number', () => {
    const draft = parseVoiceOrder('Table 5, two chicken kottu, one lime juice, extra spicy', MOCK_MENU_ITEMS);

    expect(draft.tableNumber).toBe('Table 5');
    expect(draft.items.length).toBe(2);

    const kottu = draft.items.find(i => i.name === 'Chicken Kottu');
    expect(kottu).toBeDefined();
    expect(kottu?.quantity).toBe(2);
    expect(kottu?.notes).toContain('extra spicy');

    const lime = draft.items.find(i => i.name.includes('Lime Juice'));
    expect(lime).toBeDefined();
    expect(lime?.quantity).toBe(1);
  });

  it('parses Sinhala/Singlish colloquial voice order ("kottu dekak")', () => {
    const draft = parseVoiceOrder('Table 2, kottu dekak', MOCK_MENU_ITEMS);

    expect(draft.tableNumber).toBe('Table 2');
    const kottu = draft.items.find(i => i.name === 'Chicken Kottu');
    expect(kottu).toBeDefined();
    expect(kottu?.quantity).toBe(2);
  });

  it('parses native Sinhala Unicode phrases ("චිකන් කොත්තු එකක්")', () => {
    const draft = parseVoiceOrder('චිකන් කොත්තු එකක්', MOCK_MENU_ITEMS);

    const kottu = draft.items.find(i => i.name === 'Chicken Kottu');
    expect(kottu).toBeDefined();
    expect(kottu?.quantity).toBe(1);
    expect(draft.language).toBe('si');
  });

  it('generates smart upsell suggestion when ordering food without drinks', () => {
    const draft = parseVoiceOrder('two chicken kottu spicy', MOCK_MENU_ITEMS);

    expect(draft.items.length).toBe(1);
    expect(draft.suggestedUpsell).toBeDefined();
    expect(draft.suggestedUpsell?.name).toContain('Lime Juice');
  });
});
