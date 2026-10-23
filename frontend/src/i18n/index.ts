import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import si from './locales/si.json';
import ta from './locales/ta.json';

const savedLanguage = localStorage.getItem('ralypto_lang') || 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    si: { translation: si },
    ta: { translation: ta },
  },
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes
  },
});

export const changeLanguage = (lang: 'en' | 'si' | 'ta') => {
  localStorage.setItem('ralypto_lang', lang);
  i18n.changeLanguage(lang);
};

export default i18n;
