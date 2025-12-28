/**
 * Translation Utility
 * Handles i18n translations with fallback support
 */

// Import translation files
import enTranslations from '../locales/en.json';
import koTranslations from '../locales/ko.json';
import zhTranslations from '../locales/zh.json';
import hiTranslations from '../locales/hi.json';

// Store reference for accessing current language from Zustand store
let storeRef = null;

// Translation cache
const translations = {
  en: enTranslations,
  ko: koTranslations,
  zh: zhTranslations,
  hi: hiTranslations
};

// Default language
const DEFAULT_LANGUAGE = 'en';

// Fallback translations (English)
const FALLBACK_TRANSLATIONS = enTranslations;

/**
 * Get current language from store or default
 */
export function getCurrentLanguage() {
  if (storeRef) {
    try {
      const store = storeRef.getState();
      if (store && store.currentLanguage) {
        return store.currentLanguage;
      }
    } catch (error) {
      // Store not available, use default
    }
  }
  
  // Try to get from localStorage as fallback
  try {
    const stored = localStorage.getItem('language');
    if (stored && translations[stored]) {
      return stored;
    }
  } catch (error) {
    // localStorage not available
  }
  
  return DEFAULT_LANGUAGE;
}

/**
 * Set language (updates localStorage)
 */
export function setLanguage(langCode) {
  try {
    localStorage.setItem('language', langCode);
  } catch (error) {
    // localStorage not available
  }
}

/**
 * Get available languages
 */
export function getAvailableLanguages() {
  return [
    { code: 'en', name: 'English' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese (Simplified)' },
    { code: 'hi', name: 'Hindi' }
  ];
}

/**
 * Get nested value from object using dot notation path
 */
function getNestedValue(obj, path) {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }
  
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

/**
 * Generate fallback text from key (last part of key path)
 */
function generateFallback(key) {
  const parts = key.split('.');
  const lastPart = parts[parts.length - 1];
  
  // Convert camelCase to Title Case
  return lastPart
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Translate a key with fallback support
 * @param {string} key - Translation key (e.g., 'common.appName')
 * @param {Object} params - Optional parameters for interpolation
 * @param {string} fallback - Optional fallback string (if provided, always used when translation missing)
 * @returns {string} Translated string or fallback
 */
export function t(key, params = null, fallback = null) {
  if (!key || typeof key !== 'string') {
    return fallback || '';
  }
  
  const currentLang = getCurrentLanguage();
  const langTranslations = translations[currentLang] || FALLBACK_TRANSLATIONS;
  
  // Try to get translation from current language
  let translation = getNestedValue(langTranslations, key);
  
  // If not found, try fallback language (English)
  if (translation === undefined && currentLang !== DEFAULT_LANGUAGE) {
    translation = getNestedValue(FALLBACK_TRANSLATIONS, key);
  }
  
  // If still not found, use provided fallback or generate one
  if (translation === undefined) {
    translation = fallback !== null ? fallback : generateFallback(key);
  }
  
  // Ensure we never return raw translation keys in production
  if (import.meta.env.PROD) {
    // In production, if translation looks like a key (contains dots and is not a valid path), use fallback
    if (typeof translation === 'string' && translation.includes('.') && translation === key) {
      translation = fallback !== null ? fallback : generateFallback(key);
    }
  }
  
  // Handle parameter interpolation (e.g., "Hello {{name}}")
  if (params && typeof translation === 'string') {
    return translation.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
      return params[paramKey] !== undefined ? String(params[paramKey]) : match;
    });
  }
  
  return translation;
}

/**
 * Set store reference for accessing current language
 */
export function setStoreRef(store) {
  storeRef = store;
}

// Export default t function with enhanced fallback
export default t;

