import React from 'react';
import { Sparkles, Store, ShoppingBag, MapPin } from 'lucide-react';
import { useUser, useSetCurrentScreen, useAuthStore } from '../stores';
import { isGuestUser, hasRole } from '../utils/authUtils';
import { t } from '../utils/translations';
import UnifiedSignupCTA from './UnifiedSignupCTA';

/**
 * Guest Zero State Component
 * Standardized early-access zero-state experience
 * Tone: Confident, forward-looking, exclusive - not apologetic or unfinished
 * Structure: Why empty → What you get → What happens next
 */
const GuestZeroState = ({ type = 'groupbuys' }) => {
    const user = useUser();
    const loginMethod = useAuthStore((state) => state.loginMethod);
    const setCurrentScreen = useSetCurrentScreen();
    const isGuest = isGuestUser(user, loginMethod);
    const hasVendorRole = hasRole(user, 'vendor', loginMethod);
    const hasCustomerRole = hasRole(user, 'customer', loginMethod);

    // Standardized structure for all types
    const getConfig = () => {
        switch (type) {
            case 'groupbuys':
            case 'listings':
                return {
                    titleKey: 'guestZeroState.groupBuys.title',
                    whyEmptyKey: 'guestZeroState.groupBuys.whyEmpty',
                    whatYouGetKey: 'guestZeroState.groupBuys.whatYouGet',
                    whatNextKey: 'guestZeroState.groupBuys.whatNext',
                    icon: Sparkles
                };
            case 'errands':
                return {
                    titleKey: 'guestZeroState.errands.title',
                    whyEmptyKey: 'guestZeroState.errands.whyEmpty',
                    whatYouGetKey: 'guestZeroState.errands.whatYouGet',
                    whatNextKey: 'guestZeroState.errands.whatNext',
                    icon: ShoppingBag
                };
            case 'browse':
            default:
                return {
                    titleKey: 'guestZeroState.browse.title',
                    whyEmptyKey: 'guestZeroState.browse.whyEmpty',
                    whatYouGetKey: 'guestZeroState.browse.whatYouGet',
                    whatNextKey: 'guestZeroState.browse.whatNext',
                    icon: Sparkles
                };
        }
    };

    const config = getConfig();
    const Icon = config.icon;

    // Standardized structure for all types
    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
            <div className="text-center">
                {/* Icon */}
                <div className="mb-6 flex justify-center">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full p-6">
                        <Icon className="w-12 h-12 text-blue-600" />
                    </div>
                </div>

                {/* Title - Confident and forward-looking */}
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                    {t(config.titleKey, null, 'Early Access Marketplace')}
                </h2>

                {/* Why listings are empty */}
                <p className="text-lg text-gray-600 mb-3 max-w-lg mx-auto font-medium">
                    {t(config.whyEmptyKey, null, 'We\'re curating the best vendors and building an exclusive community.')}
                </p>

                {/* What users get by joining early */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 mb-4 max-w-lg mx-auto border border-blue-100">
                    <p className="text-base text-gray-700 mb-2">
                        <strong className="text-gray-900">{t('guestZeroState.whatYouGet', null, 'What you get by joining early:')}</strong>
                    </p>
                    <p className="text-sm text-gray-600">
                        {t(config.whatYouGetKey, null, 'Priority access, exclusive deals, and first-to-know notifications.')}
                    </p>
                </div>

                {/* What happens next */}
                <p className="text-base text-gray-600 mb-8 max-w-lg mx-auto">
                    {t(config.whatNextKey, null, 'Vendors are joining now, and listings will appear here as they complete onboarding.')}
                </p>

                {/* Role-Specific CTAs */}
                <div className="space-y-4 sm:space-y-0 sm:flex sm:justify-center sm:gap-4">
                    {hasVendorRole && (type === 'groupbuys' || type === 'listings') && (
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
                            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg"
                        >
                            <Store className="w-5 h-5 mr-2" />
                            {t('guestZeroState.createFirstGroupBuy', null, 'Create the First Listing')}
                        </button>
                    )}
                    
                    {hasCustomerRole && !hasVendorRole && (type === 'groupbuys' || type === 'listings') && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="text-left">
                                    <h3 className="font-semibold text-gray-900 mb-1">
                                        {t('guestZeroState.joinWhenAreaOpens', null, 'Join When Your Area Opens')}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {t('guestZeroState.notifyWhenAvailable', null, 'We\'ll notify you when group buys become available in your region.')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {isGuest && (
                        <UnifiedSignupCTA 
                            type="early"
                            className="w-full sm:w-auto"
                        />
                    )}

                    {!hasVendorRole && !hasCustomerRole && !isGuest && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                            <p className="text-sm text-gray-600">
                                {t('guestZeroState.completeProfile', null, 'Complete your profile setup to see role-specific options.')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GuestZeroState;

