/**
 * Translation Provider
 * Global context provider for translations using Zustand store
 */

import React, { createContext, useContext, useEffect } from 'react';
import { useCurrentLanguage, useSetLanguage, useInitializeLanguage, useAppStore } from '../stores';
import { t as tUtil, setStoreRef } from '../utils/translations';

const TranslationContext = createContext({
    currentLanguage: 'en',
    setLanguage: () => {},
    t: () => ''
});

export const useTranslation = () => {
    const context = useContext(TranslationContext);
    if (!context) {
        throw new Error('useTranslation must be used within TranslationProvider');
    }
    return context;
};

export const TranslationProvider = ({ children }) => {
    const currentLanguage = useCurrentLanguage();
    const setLanguage = useSetLanguage();
    const initializeLanguage = useInitializeLanguage();

    // Initialize language on mount and set store reference
    useEffect(() => {
        initializeLanguage();
        // Set store reference for t() function
        setStoreRef(useAppStore);
    }, [initializeLanguage]);

    // Listen for language changes
    useEffect(() => {
        const handleLanguageChange = (event) => {
            // Language change is handled by Zustand store
            // This effect ensures components re-render
        };

        window.addEventListener('languagechange', handleLanguageChange);
        return () => {
            window.removeEventListener('languagechange', handleLanguageChange);
        };
    }, []);

    const t = (key, params, fallback) => {
        // Use current language from store with fallback support
        return tUtil(key, params, fallback);
    };

    return (
        <TranslationContext.Provider value={{ currentLanguage, setLanguage, t }}>
            {children}
        </TranslationContext.Provider>
    );
};

export default TranslationProvider;

