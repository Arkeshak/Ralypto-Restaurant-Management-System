import type { MenuItem, VoiceOrderDraft, VoiceParsedItem } from '../api/types';

interface NumberMapping {
  [word: string]: number;
}

const NUMBER_WORDS: NumberMapping = {
  // English
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  a: 1,
  an: 1,
  double: 2,
  triple: 3,
  // Sinhala (Latin transliteration & Unicode)
  ekak: 1,
  eka: 1,
  dekak: 2,
  deka: 2,
  tunak: 3,
  thunak: 3,
  tuna: 3,
  hatarak: 4,
  hatharak: 4,
  pahak: 5,
  paha: 5,
  'එකක්': 1,
  'දෙකක්': 2,
  'තුනක්': 3,
  'හතරක්': 4,
  'පහක්': 5,
  // Tamil
  ondru: 1,
  irandu: 2,
  moondru: 3,
  naangu: 4,
  ainthu: 5,
  'ஒன்று': 1,
  'இரண்டு': 2,
  'மூன்று': 3,
  'நான்கு': 4,
  'ஐந்து': 5,
};

const NOTE_PATTERNS = [
  'extra spicy',
  'spicy',
  'no chilli',
  'no chili',
  'less sugar',
  'no ice',
  'gravy on side',
  'extra gravy',
  'extra cheese',
  'chilli naethuwa',
  'sugar adu',
  'karapincha naethuwa',
  'කාරම් වැඩියෙන්',
  'සීනි අඩුවෙන්',
];

/**
 * Extracts table number from spoken phrase (e.g. "Table 5", "මේසය 2", "table no 3")
 */
export function extractTableNumber(text: string): string | undefined {
  const match = text.match(/(?:table\s*(?:no\.?|number)?|මේසය|மேசை)\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i);
  if (!match) return undefined;

  const rawVal = match[1].toLowerCase();
  if (/^\d+$/.test(rawVal)) {
    return `Table ${rawVal}`;
  }
  const num = NUMBER_WORDS[rawVal];
  return num ? `Table ${num}` : `Table ${rawVal}`;
}

/**
 * Detects whether language is predominantly Sinhala, Tamil, or English
 */
export function detectLanguage(text: string): 'en' | 'si' | 'ta' {
  if (/[\u0D80-\u0DFF]/.test(text)) return 'si';
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
  // Distinct Singlish grammatical markers (not menu nouns like 'kottu')
  if (/\b(ekak|dekak|tunak|hatarak|pahak|naethuwa|karala|danna|aduwen|wadiyen)\b/i.test(text)) {
    return 'si';
  }
  return 'en';
}

/**
 * Multi-lingual fuzzy parser that translates raw push-to-talk speech
 * into structured menu items, table number, notes, and upsell suggestions.
 */
export function parseVoiceOrder(
  transcript: string,
  menuItems: MenuItem[]
): VoiceOrderDraft {
  const trimmed = transcript.trim();
  const language = detectLanguage(trimmed);
  const tableNumber = extractTableNumber(trimmed);

  // Remove table reference before item parsing to avoid confusion
  let cleanText = trimmed.replace(/(?:table\s*(?:no\.?|number)?|මේසය|மேசை)\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/gi, ' ');

  // Look for notes in cleanText
  const extractedNotes: string[] = [];
  for (const note of NOTE_PATTERNS) {
    const regex = new RegExp(`\\b${note}\\b`, 'gi');
    if (regex.test(cleanText)) {
      extractedNotes.push(note);
      cleanText = cleanText.replace(regex, ' ');
    }
  }

  const parsedItems: VoiceParsedItem[] = [];
  const recognizedIndices: Array<[number, number]> = [];

  // Sort items by longest alias/name first to prevent partial substring pre-empting
  const sortedItems = [...menuItems].sort((a, b) => {
    const aLen = Math.max(a.name.length, ...(a.aliases?.map(x => x.length) || [0]));
    const bLen = Math.max(b.name.length, ...(b.aliases?.map(x => x.length) || [0]));
    return bLen - aLen;
  });

  for (const item of sortedItems) {
    const candidateTerms = [item.name, ...(item.aliases || [])];

    for (const term of candidateTerms) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Look for term anywhere in text
      const termRegex = new RegExp(`(?:(\\d+|[a-zA-Z\u0D80-\u0DFF\u0B80-\u0BFF]+)\\s+)?${escaped}(?:\\s+(\\d+|[a-zA-Z\u0D80-\u0DFF\u0B80-\u0BFF]+))?`, 'gi');
      let match: RegExpExecArray | null;

      while ((match = termRegex.exec(cleanText)) !== null) {
        // Prevent matching inside an already parsed slice
        const matchStart = match.index;
        const matchEnd = match.index + match[0].length;
        const overlaps = recognizedIndices.some(([s, e]) => matchStart < e && matchEnd > s);
        if (overlaps) continue;

        recognizedIndices.push([matchStart, matchEnd]);

        // Determine quantity: either before the term or after the term (e.g. "kottu ekak" or "two kottu")
        let quantity = 1;
        const beforeWord = match[1]?.toLowerCase();
        const afterWord = match[2]?.toLowerCase();

        if (beforeWord) {
          if (/^\d+$/.test(beforeWord)) {
            quantity = parseInt(beforeWord, 10);
          } else if (NUMBER_WORDS[beforeWord]) {
            quantity = NUMBER_WORDS[beforeWord];
          }
        } else if (afterWord) {
          if (/^\d+$/.test(afterWord)) {
            quantity = parseInt(afterWord, 10);
          } else if (NUMBER_WORDS[afterWord]) {
            quantity = NUMBER_WORDS[afterWord];
          }
        }

        // Confidence calculation
        const confidence = term.toLowerCase() === item.name.toLowerCase() ? 0.98 : 0.92;

        parsedItems.push({
          menuItemId: item.id,
          name: item.name,
          quantity: Math.max(1, quantity),
          unitPriceCents: item.priceCents,
          subtotalCents: item.priceCents * Math.max(1, quantity),
          notes: extractedNotes.length > 0 ? extractedNotes.join(', ') : undefined,
          confidence,
        });

        break; // Match one term per item
      }
    }
  }

  // Identify unrecognized phrases
  const unrecognizedPhrases: string[] = [];
  if (parsedItems.length === 0 && trimmed.length > 0) {
    unrecognizedPhrases.push(trimmed);
  }

  // Suggest upsell: if has food item but no beverage, suggest Lime Juice or Falooda
  let suggestedUpsell: VoiceOrderDraft['suggestedUpsell'] = undefined;
  const hasFood = parsedItems.some(i => i.menuItemId.includes('kottu') || i.menuItemId.includes('rice') || i.menuItemId.includes('starter'));
  const hasBeverage = parsedItems.some(i => i.menuItemId.includes('bev'));

  if (hasFood && !hasBeverage) {
    const limeJuice = menuItems.find(m => m.id === 'item-bev-lime-juice');
    if (limeJuice) {
      suggestedUpsell = {
        menuItemId: limeJuice.id,
        name: limeJuice.name,
        priceCents: limeJuice.priceCents,
        reason: 'Frequently paired with spicy dishes (smart upsell)',
      };
    }
  }

  return {
    transcript: trimmed,
    language,
    tableNumber,
    items: parsedItems,
    unrecognizedPhrases,
    suggestedUpsell,
  };
}
