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

export const changeLanguage = async (lang: 'en' | 'si' | 'ta') => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('ralypto_lang', lang);
  }

  if (lang !== 'en' && !i18n.hasResourceBundle(lang, 'translation')) {
    if (lang === 'si') {
      const siModule = await import('./locales/si.json');
      i18n.addResourceBundle('si', 'translation', siModule.default || siModule);
    } else if (lang === 'ta') {
      const taModule = await import('./locales/ta.json');
      i18n.addResourceBundle('ta', 'translation', taModule.default || taModule);
    }
  }

  await i18n.changeLanguage(lang);
};

// If saved language was Sinhala or Tamil, load the bundle on startup
if (savedLanguage !== 'en') {
  changeLanguage(savedLanguage);
}

export default i18n;
