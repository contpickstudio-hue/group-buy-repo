import React from 'react';
import { useSetCurrentScreen } from '../stores';
import { t } from '../utils/translations';

/**
 * SignUpCTA Component
 * A soft, non-aggressive call-to-action encouraging users to sign up
 * Used when guest users try to access restricted features
 */
const SignUpCTA = ({ message, className = "" }) => {
    const defaultMessage = message || t('auth.signUpToContinue');
    const setCurrentScreen = useSetCurrentScreen();

    const handleSignUp = () => {
        setCurrentScreen('auth');
    };

    return (
        <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 text-center ${className}`}>
            <div className="max-w-md mx-auto">
                <div className="mb-4">
                    <svg 
                        className="w-12 h-12 mx-auto text-blue-600" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" 
                        />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {defaultMessage}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                    {t('auth.signUpToAccess')}
                </p>
                <button
                    onClick={handleSignUp}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium min-h-[44px]"
                >
                    {t('auth.signUpToContinue')}
                </button>
            </div>
        </div>
    );
};

export default SignUpCTA;

