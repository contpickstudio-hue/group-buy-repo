/**
 * Onboarding Page
 * First-time user onboarding flow with role selection
 */

import React, { useState } from 'react';
import { useSetCurrentScreen, useSetSelectedRoles } from '../stores';
import { useAuthStore } from '../stores/authStore';
import { t } from '../utils/translations';
import { setStorageItem } from '../utils/storageUtils';
import { StorageKeys } from '../services/supabaseService';

const OnboardingPage = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedRole, setSelectedRole] = useState(null);
    const setCurrentScreen = useSetCurrentScreen();
    const setSelectedRoles = useSetSelectedRoles();
    const updateUser = useAuthStore((state) => state.updateUser);

    const onboardingSteps = [
        {
            title: t('onboarding.screen1.title') || 'Welcome!',
            emoji: '🛒',
            description: t('onboarding.screen1.description') || 'Join the Korean community marketplace',
            details: t('onboarding.screen1.details') || 'Buy, sell, and help each other'
        },
        {
            title: t('onboarding.screen2.title') || 'Choose Your Role',
            emoji: '👤',
            description: t('onboarding.screen2.description') || 'Select your primary role',
            details: t('onboarding.screen2.details') || 'You can change this later'
        }
    ];

    const roles = [
        {
            id: 'customer',
            name: 'Customer',
            emoji: '🛍️',
            description: 'Browse and buy from group buys and errands'
        },
        {
            id: 'vendor',
            name: 'Vendor',
            emoji: '🏪',
            description: 'Create listings and sell products'
        },
        {
            id: 'helper',
            name: 'Helper',
            emoji: '🤝',
            description: 'Help others by completing errands'
        }
    ];

    const handleRoleSelect = (roleId) => {
        setSelectedRole(roleId);
    };

    const handleNext = async () => {
        if (currentStep === 0) {
            // Move to role selection step
            setCurrentStep(1);
        } else if (currentStep === 1) {
            // Complete onboarding with selected role
            if (selectedRole) {
                // Set selected role
                setSelectedRoles([selectedRole]);
                
                // Update user profile if user exists
                const user = useAuthStore.getState().user;
                if (user) {
                    // Update user roles in profile
                    const updatedRoles = user.roles || [];
                    if (!updatedRoles.includes(selectedRole)) {
                        updatedRoles.push(selectedRole);
                    }
                    updateUser({ roles: updatedRoles });
                    
                    // Persist updated user
                    await setStorageItem(StorageKeys.user, { ...user, roles: updatedRoles });
                }
            }
            
            // Mark onboarding as complete
            await setStorageItem('onboardingComplete', 'true');
            await setStorageItem('onboardingRole', selectedRole || 'customer');
            
            // Navigate to auth page (or dashboard if already logged in)
            const currentUser = useAuthStore.getState().user;
            if (currentUser) {
                setCurrentScreen('dashboard');
            } else {
                setCurrentScreen('auth');
            }
        }
    };

    const handleSkip = async () => {
        // Set default role (customer) when skipping
        setSelectedRoles(['customer']);
        
        // Update user profile if user exists
        const user = useAuthStore.getState().user;
        if (user) {
            const updatedRoles = user.roles || ['customer'];
            if (!updatedRoles.includes('customer')) {
                updatedRoles.push('customer');
            }
            updateUser({ roles: updatedRoles });
            
            // Persist updated user
            await setStorageItem(StorageKeys.user, { ...user, roles: updatedRoles });
        }
        
        // Mark onboarding as complete with default role
        await setStorageItem('onboardingComplete', 'true');
        await setStorageItem('onboardingRole', 'customer');
        
        // Navigate to auth page (or dashboard if already logged in)
        const userAfter = useAuthStore.getState().user;
        if (userAfter) {
            setCurrentScreen('dashboard');
        } else {
            setCurrentScreen('auth');
        }
    };

    const currentStepData = onboardingSteps[currentStep];
    const isRoleSelectionStep = currentStep === 1;
    const isLastStep = currentStep === onboardingSteps.length - 1;
    const canProceed = isRoleSelectionStep ? selectedRole !== null : true;

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
                    {!isRoleSelectionStep ? (
                        <>
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
                        </>
                    ) : (
                        <>
                            <div className="text-5xl mb-4">
                                {currentStepData.emoji}
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                                {currentStepData.title}
                            </h1>
                            <p className="text-sm text-gray-500 mb-6">
                                {currentStepData.details}
                            </p>
                            
                            {/* Role Selection */}
                            <div className="space-y-3 mt-6">
                                {roles.map((role) => (
                                    <button
                                        key={role.id}
                                        onClick={() => handleRoleSelect(role.id)}
                                        type="button"
                                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                                            selectedRole === role.id
                                                ? 'border-blue-600 bg-blue-50 shadow-md'
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">{role.emoji}</span>
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900">
                                                    {role.name}
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    {role.description}
                                                </div>
                                            </div>
                                            {selectedRole === role.id && (
                                                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handleNext}
                        type="button"
                        className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-semibold text-base min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!canProceed}
                        aria-label={isLastStep ? 'Get Started' : t('common.next') || 'Next'}
                    >
                        {isLastStep ? 'Get Started' : (t('common.next') || 'Next')}
                    </button>
                    {!isLastStep && (
                        <button
                            onClick={handleSkip}
                            type="button"
                            className="w-full text-gray-600 py-3 px-6 rounded-xl hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-colors font-medium text-sm min-h-[44px]"
                            aria-label={t('common.skip') || 'Skip'}
                        >
                            {t('common.skip') || 'Skip'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnboardingPage;

