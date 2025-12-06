/**
 * Translation Provider
 * Global context provider for translations that triggers re-renders on language change
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentLanguage, setLanguage as setLanguageUtil, t as tUtil } from '../utils/translations';

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
    const [currentLanguage, setCurrentLanguageState] = useState(getCurrentLanguage());
    const [updateTrigger, setUpdateTrigger] = useState(0);

    // Listen for language changes in localStorage
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'language') {
                setCurrentLanguageState(e.newValue || 'en');
                setUpdateTrigger(prev => prev + 1);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        
        // Also check periodically for same-tab changes (since storage event only fires cross-tab)
        const interval = setInterval(() => {
            const current = getCurrentLanguage();
            if (current !== currentLanguage) {
                setCurrentLanguageState(current);
                setUpdateTrigger(prev => prev + 1);
            }
        }, 100);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [currentLanguage]);

    const setLanguage = (langCode) => {
        setLanguageUtil(langCode);
        setCurrentLanguageState(langCode);
        setUpdateTrigger(prev => prev + 1);
        // Force re-render by updating state
        window.dispatchEvent(new Event('languagechange'));
    };

    const t = (key, params) => {
        return tUtil(key, params);
    };

    return (
        <TranslationContext.Provider value={{ currentLanguage, setLanguage, t, updateTrigger }}>
            {children}
        </TranslationContext.Provider>
    );
};

export default TranslationProvider;

