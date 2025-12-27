import React from 'react';
import { Sparkles, Lock, ArrowRight } from 'lucide-react';
import { useSetCurrentScreen } from '../stores';
import { t } from '../utils/translations';

/**
 * Guest Early Access Component
 * Consistent messaging for guest users when they encounter restricted features
 * Replaces dashboard metrics, internal stats, and action buttons
 */
const GuestEarlyAccess = ({ 
    title = null, 
    description = null,
    showSignUpButton = true,
    compact = false 
}) => {
    const setCurrentScreen = useSetCurrentScreen();

    const defaultTitle = title || t('guestEarlyAccess.title') || 'Early Access Preview';
    const defaultDescription = description || t('guestEarlyAccess.description') || 
        'You\'re browsing in guest mode. Sign up to access full features including creating group buys, posting errands, viewing analytics, and managing your account.';

    if (compact) {
        return (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 sm:p-6">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                        <Lock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">
                            {defaultTitle}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                            {defaultDescription}
                        </p>
                        {showSignUpButton && (
                            <button
                                onClick={() => setCurrentScreen('auth')}
                                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                Sign Up for Full Access
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-8 sm:py-12 px-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 sm:p-8 text-center">
                {/* Icon */}
                <div className="mb-4 flex justify-center">
                    <div className="bg-white rounded-full p-4 shadow-sm">
                        <Sparkles className="w-8 h-8 text-blue-600" />
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                    {defaultTitle}
                </h2>

                {/* Description */}
                <p className="text-base sm:text-lg text-gray-600 mb-6 max-w-lg mx-auto">
                    {defaultDescription}
                </p>

                {/* Benefits List */}
                <div className="mb-6 text-left max-w-md mx-auto">
                    <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">✓</span>
                            <span>Create and manage group buys</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">✓</span>
                            <span>Post and track errands</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">✓</span>
                            <span>View analytics and earnings</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">✓</span>
                            <span>Access referral program and credits</span>
                        </li>
                    </ul>
                </div>

                {/* CTA Button */}
                {showSignUpButton && (
                    <button
                        onClick={() => setCurrentScreen('auth')}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium min-h-[48px] shadow-sm"
                    >
                        Sign Up for Full Access
                        <ArrowRight className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default GuestEarlyAccess;

