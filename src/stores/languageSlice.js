/**
 * Language Slice
 * Manages global language state and persistence
 */

import { getCurrentLanguage, setLanguage as setLanguageUtil, getAvailableLanguages } from '../utils/translations';
import { getStorageItem, setStorageItem } from '../utils/storageUtils';

export const createLanguageSlice = (set, get) => ({
  // Language state
  currentLanguage: 'en',
  availableLanguages: getAvailableLanguages(),
  isInitialized: false,

  // Initialize language from storage
  initializeLanguage: async () => {
    try {
      const stored = await getStorageItem('language');
      const lang = stored && getAvailableLanguages().find(l => l.code === stored)
        ? stored
        : 'en';
      
      set((state) => {
        state.currentLanguage = lang;
        state.isInitialized = true;
      });
      
      // Also update localStorage for backward compatibility
      if (stored !== lang) {
        await setStorageItem('language', lang);
      }
      
      return { success: true, language: lang };
    } catch (error) {
      console.error('Failed to initialize language:', error);
      set((state) => {
        state.currentLanguage = 'en';
        state.isInitialized = true;
      });
      return { success: true, language: 'en' };
    }
  },

  // Set language
  setLanguage: async (langCode) => {
    const available = getAvailableLanguages();
    const lang = available.find(l => l.code === langCode);
    
    if (!lang) {
      console.warn(`Language ${langCode} not available`);
      return { success: false, error: 'Language not available' };
    }

    try {
      // Update state
      set((state) => {
        state.currentLanguage = langCode;
      });

      // Persist to storage
      await setStorageItem('language', langCode);
      
      // Also update localStorage for backward compatibility
      setLanguageUtil(langCode);
      
      // Dispatch event for components that listen to it
      window.dispatchEvent(new CustomEvent('languagechange', { detail: { language: langCode } }));
      
      return { success: true, language: langCode };
    } catch (error) {
      console.error('Failed to set language:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current language
  getCurrentLanguage: () => {
    return get().currentLanguage;
  },

  // Get available languages
  getAvailableLanguages: () => {
    return get().availableLanguages;
  }
});

