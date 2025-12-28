import React, { useState } from 'react';
import { useSetCurrentScreen } from '../stores';
import { useTranslation } from '../contexts/TranslationProvider';
import EarlyAccessModal from './EarlyAccessModal';
import { ArrowRight } from 'lucide-react';

/**
 * Unified Signup CTA Component
 * Provides clear distinction between Early Access (waitlist) and Full Access (signup)
 * Shows explanation before user commits
 */
const UnifiedSignupCTA = ({ 
    type = 'full', // 'full' for full access, 'early' for early access/waitlist
    variant = 'button', // 'button' or 'inline'
    className = '',
    onClick
}) => {
    const { t } = useTranslation();
    const setCurrentScreen = useSetCurrentScreen();
    const [showModal, setShowModal] = useState(false);

    const handleClick = () => {
        if (onClick) {
            onClick();
            return;
        }

        if (type === 'early') {
            // Show early access modal
            setShowModal(true);
        } else {
            // Go directly to full signup
            setCurrentScreen('auth');
        }
    };

    const handleJoinWaitlist = () => {
        // After joining waitlist, optionally redirect to signup
        // For now, just close modal - user can sign up separately if they want
    };

    if (variant === 'inline') {
        return (
            <>
                <button
                    onClick={handleClick}
                    className={`inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors ${className}`}
                >
                    {type === 'early' 
                        ? t('unifiedCTA.joinEarlyAccess', null, 'Join Early Access')
                        : t('unifiedCTA.createAccount', null, 'Create Account')
                    }
                    <ArrowRight className="w-4 h-4" />
                </button>
                {type === 'early' && (
                    <EarlyAccessModal 
                        isOpen={showModal} 
                        onClose={() => setShowModal(false)}
                        onJoinWaitlist={handleJoinWaitlist}
                    />
                )}
            </>
        );
    }

    return (
        <>
            <button
                onClick={handleClick}
                className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg ${className}`}
            >
                {type === 'early'
                    ? t('unifiedCTA.joinEarlyAccess', null, 'Join Early Access')
                    : t('unifiedCTA.createAccount', null, 'Create Account')
                }
                <ArrowRight className="w-5 h-5" />
            </button>
            {type === 'early' && (
                <EarlyAccessModal 
                    isOpen={showModal} 
                    onClose={() => setShowModal(false)}
                    onJoinWaitlist={handleJoinWaitlist}
                />
            )}
        </>
    );
};

/**
 * Signup Choice Component
 * Shows both options with clear explanation
 */
export const SignupChoice = ({ className = '' }) => {
    const { t } = useTranslation();
    const [showEarlyAccessModal, setShowEarlyAccessModal] = useState(false);
    const setCurrentScreen = useSetCurrentScreen();

    return (
        <>
            <div className={`space-y-4 ${className}`}>
                {/* Explanation */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                        {t('signupChoice.chooseOption', null, 'Choose your option:')}
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>
                                <strong>{t('signupChoice.earlyAccess', null, 'Early Access:')}</strong>{' '}
                                {t('signupChoice.earlyAccessDesc', null, 'Join waitlist to be notified when services launch in your area')}
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>
                                <strong>{t('signupChoice.fullAccess', null, 'Full Access:')}</strong>{' '}
                                {t('signupChoice.fullAccessDesc', null, 'Create account to start using all features immediately')}
                            </span>
                        </li>
                    </ul>
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        onClick={() => setShowEarlyAccessModal(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-medium min-h-[48px]"
                    >
                        {t('signupChoice.joinWaitlist', null, 'Join Waitlist')}
                    </button>
                    <button
                        onClick={() => setCurrentScreen('auth')}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium min-h-[48px]"
                    >
                        {t('signupChoice.createAccount', null, 'Create Account')}
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <EarlyAccessModal 
                isOpen={showEarlyAccessModal} 
                onClose={() => setShowEarlyAccessModal(false)}
                onJoinWaitlist={() => {}}
            />
        </>
    );
};

export default UnifiedSignupCTA;

