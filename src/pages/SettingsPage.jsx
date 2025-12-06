/**
 * Settings Page
 * Full settings page with account, language, notifications, region, and app info
 */

import React, { useState, useEffect } from 'react';
import { useUser, useSignOut, useSetCurrentScreen, useUpdateGroupBuyFilters, useUpdateErrandFilters } from '../stores';
import { getCurrentLanguage, setLanguage, getAvailableLanguages, t } from '../utils/translations';
import { signOut as supabaseSignOut } from '../services/supabaseService';

const SettingsPage = () => {
    const user = useUser();
    const signOutAction = useSignOut();
    const setCurrentScreen = useSetCurrentScreen();
    const updateGroupBuyFilters = useUpdateGroupBuyFilters();
    const updateErrandFilters = useUpdateErrandFilters();
    
    const [currentLang, setCurrentLang] = useState(getCurrentLanguage());
    const [preferredRegion, setPreferredRegion] = useState(() => {
        try {
            return localStorage.getItem('preferredRegion') || 'Toronto';
        } catch {
            return 'Toronto';
        }
    });
    const [autoApplyFilter, setAutoApplyFilter] = useState(() => {
        try {
            return localStorage.getItem('autoApplyFilter') === 'true';
        } catch {
            return false;
        }
    });
    const [notifications, setNotifications] = useState({
        groupBuyUpdates: true,
        errandUpdates: true,
        systemNotifications: true
    });

    const availableLanguages = getAvailableLanguages();

    const handleLanguageChange = (langCode) => {
        setLanguage(langCode);
        setCurrentLang(langCode);
    };


    const handleAutoApplyFilterChange = (enabled) => {
        setAutoApplyFilter(enabled);
        try {
            localStorage.setItem('autoApplyFilter', enabled.toString());
            // Apply preferred region filter immediately if enabled
            if (enabled && preferredRegion && preferredRegion !== 'all') {
                updateGroupBuyFilters({ region: preferredRegion });
                updateErrandFilters({ region: preferredRegion });
            } else if (!enabled) {
                // Reset to 'all' if disabled
                updateGroupBuyFilters({ region: 'all' });
                updateErrandFilters({ region: 'all' });
            }
        } catch (error) {
            console.error('Failed to save filter preference:', error);
        }
    };

    const handleRegionChange = (region) => {
        setPreferredRegion(region);
        try {
            localStorage.setItem('preferredRegion', region);
            // Auto-apply if enabled
            if (autoApplyFilter && region !== 'all') {
                updateGroupBuyFilters({ region });
                updateErrandFilters({ region });
            }
        } catch (error) {
            console.error('Failed to save region preference:', error);
        }
    };

    const handleNotificationToggle = (key) => {
        setNotifications(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
        // TODO: Save to backend when notifications are implemented
    };

    const handleLogout = async () => {
        try {
            await supabaseSignOut();
            await signOutAction();
            setCurrentScreen('start');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (!user) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="text-center">
                    <p className="text-gray-500">{t('common.welcome')}</p>
                    <button
                        onClick={() => setCurrentScreen('auth')}
                        className="mt-4 btn-primary"
                    >
                        Sign In
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
            {/* Mobile-optimized header */}
            <div className="sticky top-0 bg-white z-10 py-3 mb-4 border-b border-gray-200 -mx-4 px-4 shadow-sm">
                <div className="flex items-center">
                    <button
                        onClick={() => setCurrentScreen('profile')}
                        className="text-blue-600 hover:text-blue-700 font-medium flex items-center min-h-[44px] mr-4"
                    >
                        <span className="mr-2 text-xl">←</span>
                        <span className="text-base">{t('common.back')}</span>
                    </button>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex-1 text-center">
                        {t('settings.title')}
                    </h1>
                    <div className="w-16"></div> {/* Spacer for centering */}
                </div>
            </div>

            {/* Account Settings */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-5">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">{t('settings.account.title')}</h2>
                <div className="space-y-4">
                    {/* Profile Picture */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('settings.account.profilePicture')}
                        </label>
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                <span className="text-2xl font-bold text-white">
                                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </span>
                            </div>
                            <button className="btn-secondary text-sm min-h-[44px]">
                                {t('common.change')}
                            </button>
                        </div>
                    </div>

                    {/* Display Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('settings.account.displayName')}
                        </label>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-900">{user.name || 'Not set'}</span>
                            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm min-h-[44px] px-3">
                                {t('common.edit')}
                            </button>
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('settings.account.email')}
                        </label>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 text-sm">{user.email}</span>
                            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm min-h-[44px] px-3">
                                {t('common.change')}
                            </button>
                        </div>
                    </div>

                    {/* Manage Account Button */}
                    <button className="w-full btn-secondary mt-4 min-h-[48px]">
                        {t('settings.account.manageAccount')}
                    </button>
                </div>
            </div>

            {/* Language Settings */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-5">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">{t('settings.language.title')}</h2>
                <div className="space-y-2">
                    {availableLanguages.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang.code)}
                            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all min-h-[56px] ${
                                currentLang === lang.code
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center space-x-3">
                                <span className="text-2xl">{lang.flag}</span>
                                <div className="text-left">
                                    <div className="font-medium text-gray-900">{lang.name}</div>
                                    <div className="text-sm text-gray-500">{lang.nativeName}</div>
                                </div>
                            </div>
                            {currentLang === lang.code && (
                                <span className="text-blue-600 font-bold">✓</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Notifications Preferences */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-5">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">{t('settings.notifications.title')}</h2>
                <div className="space-y-4">
                    {[
                        { key: 'groupBuyUpdates', label: t('settings.notifications.groupBuyUpdates') },
                        { key: 'errandUpdates', label: t('settings.notifications.errandUpdates') },
                        { key: 'systemNotifications', label: t('settings.notifications.systemNotifications') }
                    ].map(notif => (
                        <div key={notif.key} className="flex items-center justify-between py-2 min-h-[56px]">
                            <span className="text-gray-900 font-medium">{notif.label}</span>
                            <button
                                onClick={() => handleNotificationToggle(notif.key)}
                                className={`relative w-12 h-6 rounded-full transition-colors min-w-[48px] min-h-[48px] flex items-center ${
                                    notifications[notif.key] ? 'bg-blue-600' : 'bg-gray-300'
                                }`}
                            >
                                <span
                                    className={`absolute w-5 h-5 bg-white rounded-full transition-transform ${
                                        notifications[notif.key] ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Region & Location Preferences */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-5">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">{t('settings.region.title')}</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('settings.region.preferredRegion')}
                        </label>
                        <select
                            value={preferredRegion}
                            onChange={(e) => handleRegionChange(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                        >
                            <option value="Toronto">Toronto</option>
                            <option value="Hamilton">Hamilton</option>
                            <option value="Niagara">Niagara</option>
                        </select>
                    </div>
                    <div className="flex items-center justify-between py-2 min-h-[56px]">
                        <span className="text-gray-900 font-medium text-sm">
                            {t('settings.region.autoApplyFilter')}
                        </span>
                        <button
                            onClick={() => handleAutoApplyFilterChange(!autoApplyFilter)}
                            className={`relative w-12 h-6 rounded-full transition-colors min-w-[48px] min-h-[48px] flex items-center ${
                                autoApplyFilter ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                        >
                            <span
                                className={`absolute w-5 h-5 bg-white rounded-full transition-transform ${
                                    autoApplyFilter ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* App Information */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-5">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">{t('settings.app.title')}</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 min-h-[56px]">
                        <span className="text-gray-700">{t('settings.app.version')}</span>
                        <span className="text-gray-900 font-medium">3.2.0</span>
                    </div>
                    <button
                        onClick={() => window.location.href = 'mailto:support@oksnap.com?subject=Bug Report'}
                        className="w-full text-left py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors min-h-[48px] text-blue-600 font-medium"
                    >
                        {t('settings.app.reportBug')}
                    </button>
                    <button
                        onClick={() => {
                            // Placeholder: Show terms page
                            alert('Terms & Conditions page coming soon');
                        }}
                        className="w-full text-left py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors min-h-[48px] text-gray-700"
                    >
                        {t('settings.app.terms')}
                    </button>
                    <button
                        onClick={() => {
                            // Placeholder: Show privacy policy
                            alert('Privacy Policy page coming soon');
                        }}
                        className="w-full text-left py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors min-h-[48px] text-gray-700"
                    >
                        {t('settings.app.privacy')}
                    </button>
                </div>
            </div>

            {/* Logout Button */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
                <button
                    onClick={handleLogout}
                    className="w-full bg-red-600 text-white py-3 px-6 rounded-xl hover:bg-red-700 transition-colors font-semibold min-h-[48px]"
                >
                    {t('common.logout')}
                </button>
            </div>
        </div>
    );
};

export default SettingsPage;

