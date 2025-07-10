import { useState, useEffect } from 'react';
import { translations } from '@/utils/translations';

export type Language = 'he' | 'de' | 'en';

export const useLanguage = () => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('preferred-language');
    return (saved as Language) || 'he'; // Default to Hebrew
  });

  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('preferred-language', language);
    
    // Set RTL for Hebrew
    const rtl = language === 'he';
    setIsRTL(rtl);
    
    // Update document direction
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = translations[language] || translations['en']; // Fallback to English if language not found

  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

  return {
    language,
    isRTL,
    t,
    changeLanguage,
    availableLanguages: [
      { code: 'he', name: 'עברית', flag: '🇮🇱' },
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    ] as const
  };
};