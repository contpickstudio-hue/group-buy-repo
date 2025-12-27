import React from 'react';
import { useSetCurrentScreen } from '../stores';
import { t } from '../utils/translations';

/**
 * UpgradeToVendorCTA Component
 * Encourages users to upgrade to vendor role to access group buy creation
 */
const UpgradeToVendorCTA = ({ className = "" }) => {
    const setCurrentScreen = useSetCurrentScreen();

    const handleContact = () => {
        // Navigate to settings or profile where they can manage roles
        setCurrentScreen('profile');
    };

    return (
        <div className={`bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 text-center ${className}`}>
            <div className="max-w-md mx-auto">
                <div className="mb-4">
                    <svg 
                        className="w-12 h-12 mx-auto text-purple-600" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
                        />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('groupBuy.vendorRoleRequiredTitle')}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                    {t('groupBuy.vendorRoleDescription')}
                </p>
                <button
                    onClick={handleContact}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium min-h-[44px]"
                >
                    {t('groupBuy.upgradeToVendor')}
                </button>
            </div>
        </div>
    );
};

export default UpgradeToVendorCTA;

