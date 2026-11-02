import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';

const savedLanguage = (typeof localStorage !== 'undefined' && (localStorage.getItem('ralypto_lang') as 'en' | 'si' | 'ta')) || 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
  },
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes
  },
});

const baseChangeLanguage = i18n.changeLanguage.bind(i18n);

async function loadBundle(lang: string) {
  if (i18n.hasResourceBundle(lang, 'translation')) return;
  if (lang === 'si') {
    const siModule = await import('./locales/si.json');
    i18n.addResourceBundle('si', 'translation', siModule.default || siModule);
  } else if (lang === 'ta') {
    const taModule = await import('./locales/ta.json');
    i18n.addResourceBundle('ta', 'translation', taModule.default || taModule);
  }
}

// Every caller (shell, login pages, QR menu, settings) uses i18n.changeLanguage
// directly, so wrap it: lazy-load the Sinhala/Tamil bundle and remember the choice.
i18n.changeLanguage = async (lng?: string, callback?: Parameters<typeof baseChangeLanguage>[1]) => {
  if (lng) {
    await loadBundle(lng);
    if (typeof localStorage !== 'undefined') localStorage.setItem('ralypto_lang', lng);
  }
  return baseChangeLanguage(lng, callback);
};

export const changeLanguage = async (lang: 'en' | 'si' | 'ta') => {
  await i18n.changeLanguage(lang);
};

// If saved language was Sinhala or Tamil, load the bundle on startup
if (savedLanguage !== 'en') {
  changeLanguage(savedLanguage);
}

export default i18n;
