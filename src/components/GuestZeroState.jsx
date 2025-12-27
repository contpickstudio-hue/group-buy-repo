import React from 'react';
import { Sparkles, Store, ShoppingBag, MapPin } from 'lucide-react';
import { useUser, useSetCurrentScreen, useAuthStore } from '../stores';
import { isGuestUser, hasRole } from '../utils/authUtils';
import { t } from '../utils/translations';

/**
 * Guest Zero State Component
 * Designed zero-state experience for when there are no listings
 * Tone: Calm, confident, intentional - not apologetic
 */
const GuestZeroState = ({ type = 'groupbuys' }) => {
    const user = useUser();
    const loginMethod = useAuthStore((state) => state.loginMethod);
    const setCurrentScreen = useSetCurrentScreen();
    const isGuest = isGuestUser(user, loginMethod);
    const hasVendorRole = hasRole(user, 'vendor', loginMethod);
    const hasCustomerRole = hasRole(user, 'customer', loginMethod);

    if (type === 'groupbuys' || type === 'listings') {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4">
                <div className="text-center">
                    {/* Icon */}
                    <div className="mb-6 flex justify-center">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full p-6">
                            <Sparkles className="w-12 h-12 text-blue-600" />
                        </div>
                    </div>

                    {/* Main Message */}
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                        {t('guestZeroState.buildingSpecial')}
                    </h2>
                    <p className="text-lg text-gray-600 mb-2 max-w-lg mx-auto">
                        {t('guestZeroState.earlyAccessDescription')}
                    </p>
                    <p className="text-base text-gray-500 mb-8 max-w-lg mx-auto">
                        {t('guestZeroState.beFirstToJoin')}
                    </p>

                    {/* Role-Specific CTAs */}
                    <div className="space-y-4 sm:space-y-0 sm:flex sm:justify-center sm:gap-4">
                        {hasVendorRole && (
                            <button
                                onClick={() => {
                                    setCurrentScreen('dashboard');
                                    setTimeout(() => {
                                        const form = document.querySelector('[data-testid="create-product-form"]');
                                        if (form) {
                                            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }
                                    }, 100);
                                }}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium min-h-[48px] shadow-sm"
                            >
                                <Store className="w-5 h-5 mr-2" />
                                {t('guestZeroState.createFirstGroupBuy')}
                            </button>
                        )}
                        
                        {hasCustomerRole && !hasVendorRole && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-left">
                                        <h3 className="font-semibold text-gray-900 mb-1">
                                            {t('guestZeroState.joinWhenAreaOpens')}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {t('guestZeroState.notifyWhenAvailable')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isGuest && (
                            <button
                                onClick={() => setCurrentScreen('auth')}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium min-h-[48px] shadow-sm"
                            >
                                <ShoppingBag className="w-5 h-5 mr-2" />
                                {t('guestZeroState.signUpEarlyAccess')}
                            </button>
                        )}

                        {!hasVendorRole && !hasCustomerRole && !isGuest && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                                <p className="text-sm text-gray-600">
                                    {t('guestZeroState.completeProfile')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Additional Context */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-500">
                            {t('guestZeroState.earlyAccessBenefits')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Default fallback
    return (
        <div className="max-w-2xl mx-auto py-12 px-4 text-center">
            <div className="mb-6 flex justify-center">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full p-6">
                    <Sparkles className="w-12 h-12 text-blue-600" />
                </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                {t('guestZeroState.earlyAccessCommunity')}
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto">
                {t('guestZeroState.newCommunity')}
            </p>
        </div>
    );
};

export default GuestZeroState;

