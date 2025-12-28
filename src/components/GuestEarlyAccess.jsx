import React from 'react';
import { Sparkles, Lock, ArrowRight } from 'lucide-react';
import { useSetCurrentScreen } from '../stores';
import { t } from '../utils/translations';
import UnifiedSignupCTA from './UnifiedSignupCTA';

/**
 * Guest Early Access Component
 * Consistent messaging for guest users when they encounter restricted features
 * Replaces dashboard metrics, internal stats, and action buttons
 */
const GuestEarlyAccess = ({ 
    title = null, 
    description = null,
    benefits = null,
    showSignUpButton = true,
    compact = false 
}) => {
    const setCurrentScreen = useSetCurrentScreen();

    const defaultTitle = title || t('guestEarlyAccess.title') || 'Guest Preview Mode';
    const defaultDescription = description || t('guestEarlyAccess.description') || 
        'You\'re browsing in guest preview mode. Create an account to unlock full features including creating group buys, posting errands, viewing analytics, and managing your account.';
    // Use provided benefits or default generic benefits, but only if benefits array is not explicitly empty
    const defaultBenefits = benefits !== null ? benefits : [
        t('guestEarlyAccess.benefit1', null, 'Track your savings and earnings'),
        t('guestEarlyAccess.benefit2', null, 'View active orders and errands'),
        t('guestEarlyAccess.benefit3', null, 'Manage credits and referrals'),
        t('guestEarlyAccess.benefit4', null, 'Quick access to create content')
    ];

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
                        {defaultBenefits && defaultBenefits.length > 0 && (
                            <ul className="space-y-1.5 mb-3 text-xs text-gray-600">
                                {defaultBenefits.slice(0, 3).map((benefit, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <span className="text-blue-600 mt-0.5 flex-shrink-0">•</span>
                                        <span>{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {showSignUpButton && (
                            <UnifiedSignupCTA 
                                type="full"
                                variant="inline"
                                className="text-sm"
                            />
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
                {defaultBenefits && defaultBenefits.length > 0 && (
                    <div className="mb-6 text-left max-w-md mx-auto">
                        <ul className="space-y-2.5 text-sm text-gray-700">
                            {defaultBenefits.map((benefit, index) => (
                                <li key={index} className="flex items-start gap-2.5">
                                    <span className="text-blue-600 mt-0.5 flex-shrink-0">✓</span>
                                    <span>{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* CTA Button */}
                {showSignUpButton && (
                    <UnifiedSignupCTA 
                        type="full"
                    />
                )}
            </div>
        </div>
    );
};

export default GuestEarlyAccess;

