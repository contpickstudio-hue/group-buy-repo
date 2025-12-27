/**
 * Translation Utility
 * Handles multilingual support for the app
 */

// Import translation files (Vite handles JSON imports automatically)
import enTranslations from '../locales/en.json';
import koTranslations from '../locales/ko.json';
import zhTranslations from '../locales/zh.json';
import hiTranslations from '../locales/hi.json';

// Translation dictionary with fallback
const translations = {
    en: enTranslations || {},
    ko: koTranslations || enTranslations || {},
    zh: zhTranslations || enTranslations || {},
    hi: hiTranslations || enTranslations || {}
};

// Default language
const DEFAULT_LANGUAGE = 'en';

/**
 * Get current language from localStorage
 * @returns {string} Language code
 * Note: This is now a fallback. The Zustand store is the source of truth.
 */
export function getCurrentLanguage() {
    try {
        const stored = localStorage.getItem('language');
        if (stored && translations[stored]) {
            return stored;
        }
    } catch (error) {
        console.warn('Failed to get language from localStorage:', error);
    }
    return DEFAULT_LANGUAGE;
}

/**
 * Set language preference
 * @param {string} langCode - Language code (en, ko, zh, hi)
 * Note: This function now only saves to localStorage. The TranslationProvider handles UI updates.
 */
export function setLanguage(langCode) {
    if (translations[langCode]) {
        try {
            localStorage.setItem('language', langCode);
            // Dispatch event for TranslationProvider to pick up
            window.dispatchEvent(new Event('languagechange'));
        } catch (error) {
            console.error('Failed to save language preference:', error);
        }
    }
}

// Store reference for accessing current language
let storeRef = null;

/**
 * Set store reference for translation function
 * Called by TranslationProvider
 */
export function setStoreRef(store) {
    storeRef = store;
}

/**
 * Translation function
 * @param {string} key - Translation key (e.g., "common.welcome")
 * @param {Object} params - Optional parameters for interpolation
 * @param {string} forceLang - Optional language code to force (for use outside React context)
 * @returns {string} Translated text
 */
export function t(key, params = {}, forceLang = null) {
    // Try to get language from Zustand store if available
    let lang = forceLang;
    if (!lang && storeRef) {
        try {
            const state = storeRef.getState();
            if (state && state.currentLanguage) {
                lang = state.currentLanguage;
            }
        } catch (e) {
            // Store not available, fall back to localStorage
        }
    }
    
    // Fallback to localStorage if store not available
    if (!lang) {
        lang = getCurrentLanguage();
    }
    
    const translation = translations[lang] || translations[DEFAULT_LANGUAGE];
    
    // Navigate nested object using dot notation
    const keys = key.split('.');
    let value = translation;
    
    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        } else {
            // Fallback to English if translation not found
            const enValue = translations[DEFAULT_LANGUAGE];
            let fallback = enValue;
            for (const fk of keys) {
                if (fallback && typeof fallback === 'object' && fk in fallback) {
                    fallback = fallback[fk];
                } else {
                    return key; // Return key if translation not found
                }
            }
            value = fallback;
            break;
        }
    }
    
    // Handle string interpolation if params provided
    if (typeof value === 'string' && params) {
        return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
            return params[paramKey] !== undefined ? params[paramKey] : match;
        });
    }
    
    return typeof value === 'string' ? value : key;
}

/**
 * Get available languages
 * @returns {Array} Array of language objects with code, name, and flag
 */
export function getAvailableLanguages() {
    return [
        { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
        { code: 'ko', name: 'Korean', flag: '🇰🇷', nativeName: '한국어' },
        { code: 'zh', name: 'Chinese (Simplified)', flag: '🇨🇳', nativeName: '中文' },
        { code: 'hi', name: 'Hindi', flag: '🇮🇳', nativeName: 'हिंदी' }
    ];
}

