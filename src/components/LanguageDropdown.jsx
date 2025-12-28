import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useCurrentLanguage, useSetLanguage, useAvailableLanguages } from '../stores';
import { useTranslation } from '../contexts/TranslationProvider';

/**
 * Language Dropdown Component
 * Displays a dropdown menu for language selection
 */
const LanguageDropdown = () => {
    const currentLanguage = useCurrentLanguage();
    const setLanguage = useSetLanguage();
    const availableLanguages = useAvailableLanguages();
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
                document.removeEventListener('touchstart', handleClickOutside);
            };
        }
    }, [isOpen]);

    const languages = Array.isArray(availableLanguages) && availableLanguages.length > 0 
        ? availableLanguages 
        : [{ code: 'en', flag: '🇺🇸', nativeName: 'English', name: 'English' }];
    const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

    const handleLanguageChange = async (langCode) => {
        if (langCode !== currentLanguage) {
            await setLanguage(langCode);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2.5 sm:py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors min-h-[48px] min-w-[48px] sm:min-h-[44px] sm:min-w-[44px] touch-manipulation"
                aria-label={t('common.selectLanguage') || 'Select Language'}
                aria-expanded={isOpen}
                aria-haspopup="true"
                title={t('common.selectLanguage') || 'Select Language'}
            >
                <Globe size={18} className="text-gray-600 flex-shrink-0" />
                <span className="hidden sm:inline text-sm font-medium">
                    {currentLang.flag} {currentLang.nativeName}
                </span>
                <span className="sm:hidden text-sm font-medium">
                    {currentLang.flag}
                </span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-[80vh] overflow-y-auto">
                    <div className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100 sticky top-0 bg-white">
                        {t('common.selectLanguage') || 'Select Language'}
                    </div>
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang.code)}
                            className={`w-full flex items-center justify-between px-4 py-4 sm:py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[56px] sm:min-h-[48px] touch-manipulation ${
                                lang.code === currentLanguage ? 'bg-blue-50' : ''
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-lg flex-shrink-0">{lang.flag}</span>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900">
                                        {lang.nativeName}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {lang.name}
                                    </span>
                                </div>
                            </div>
                            {lang.code === currentLanguage && (
                                <Check size={18} className="text-blue-600 flex-shrink-0" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LanguageDropdown;

