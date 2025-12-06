/**
 * Onboarding Page
 * First-time user onboarding flow (3-4 screens)
 */

import React, { useState } from 'react';
import { useSetCurrentScreen } from '../stores';
import { t } from '../utils/translations';

const OnboardingPage = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const setCurrentScreen = useSetCurrentScreen();

    const onboardingSteps = [
        {
            title: t('onboarding.screen1.title'),
            emoji: '🛒',
            description: t('onboarding.screen1.description'),
            details: t('onboarding.screen1.details')
        },
        {
            title: t('onboarding.screen2.title'),
            emoji: '💰',
            description: t('onboarding.screen2.description'),
            details: t('onboarding.screen2.details')
        },
        {
            title: t('onboarding.screen3.title'),
            emoji: '🤝',
            description: t('onboarding.screen3.description'),
            details: t('onboarding.screen3.details')
        },
        {
            title: t('onboarding.screen4.title'),
            emoji: '✨',
            description: t('onboarding.screen4.description'),
            details: t('onboarding.screen4.details')
        }
    ];

    const handleNext = () => {
        if (currentStep < onboardingSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // Complete onboarding
            localStorage.setItem('onboardingComplete', 'true');
            setCurrentScreen('auth');
        }
    };

    const handleSkip = () => {
        localStorage.setItem('onboardingComplete', 'true');
        setCurrentScreen('auth');
    };

    const currentStepData = onboardingSteps[currentStep];
    const isLastStep = currentStep === onboardingSteps.length - 1;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-8">
            <div className="max-w-md w-full">
                {/* Progress Indicator */}
                <div className="flex justify-center mb-8 space-x-2">
                    {onboardingSteps.map((_, index) => (
                        <div
                            key={index}
                            className={`h-2 rounded-full transition-all duration-300 ${
                                index <= currentStep
                                    ? 'bg-blue-600 w-8'
                                    : 'bg-gray-300 w-2'
                            }`}
                        />
                    ))}
                </div>

                {/* Content Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center mb-6">
                    <div className="text-6xl mb-6 animate-bounce">
                        {currentStepData.emoji}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                        {currentStepData.title}
                    </h1>
                    <p className="text-base sm:text-lg text-gray-600 mb-2 leading-relaxed">
                        {currentStepData.description}
                    </p>
                    <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
                        {currentStepData.details}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handleNext}
                        type="button"
                        className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-semibold text-base min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={false}
                        aria-label={isLastStep ? t('common.signUp') : t('common.next')}
                    >
                        {isLastStep ? t('common.signUp') : t('common.next')}
                    </button>
                    {!isLastStep && (
                        <button
                            onClick={handleSkip}
                            type="button"
                            className="w-full text-gray-600 py-3 px-6 rounded-xl hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-colors font-medium text-sm min-h-[44px]"
                            aria-label={t('common.skip')}
                        >
                            {t('common.skip')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnboardingPage;

