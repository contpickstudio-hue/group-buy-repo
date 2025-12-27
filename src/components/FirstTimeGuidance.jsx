import React, { useState, useEffect } from 'react';
import { useUser, useSetCurrentScreen } from '../stores';
import { getStorageItem, setStorageItem } from '../utils/storageUtils';
import { X, Info } from 'lucide-react';

const FirstTimeGuidance = () => {
    const [showGuidance, setShowGuidance] = useState(false);
    const [currentTip, setCurrentTip] = useState(0);
    const user = useUser();
    const setCurrentScreen = useSetCurrentScreen();

    useEffect(() => {
        const checkGuidanceStatus = async () => {
            try {
                const guidanceDismissed = await getStorageItem('guidanceDismissed');
                if (!guidanceDismissed && !user) {
                    // Only show guidance for non-authenticated users
                    setShowGuidance(true);
                }
            } catch (error) {
                console.warn('Failed to check guidance status:', error);
            }
        };

        checkGuidanceStatus();
    }, [user]);

    const handleDismiss = async () => {
        try {
            await setStorageItem('guidanceDismissed', 'true');
            setShowGuidance(false);
        } catch (error) {
            console.warn('Failed to save guidance status:', error);
            setShowGuidance(false);
        }
    };

    const tips = [
        {
            title: 'Welcome to Korean Community Commerce!',
            message: 'Browse group buys and errands from your local Korean community.',
            action: () => setCurrentScreen('browse')
        },
        {
            title: 'Join Group Buys',
            message: 'Save money by joining group purchases organized by the community.',
            action: () => setCurrentScreen('groupbuys')
        },
        {
            title: 'Request Errands',
            message: 'Need something? Request an errand and connect with helpers.',
            action: () => setCurrentScreen('errands')
        }
    ];

    if (!showGuidance || user) {
        return null;
    }

    const tip = tips[currentTip];

    return (
        <div className="fixed bottom-24 md:bottom-8 right-4 z-40 max-w-sm animate-slide-up">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-gray-900 text-sm">{tip.title}</h3>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Dismiss guidance"
                    >
                        <X size={18} />
                    </button>
                </div>
                <p className="text-sm text-gray-600 mb-3">{tip.message}</p>
                <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                        {tips.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentTip(index)}
                                className={`w-2 h-2 rounded-full transition-colors ${
                                    index === currentTip ? 'bg-blue-600' : 'bg-gray-300'
                                }`}
                                aria-label={`Tip ${index + 1}`}
                            />
                        ))}
                    </div>
                    <button
                        onClick={() => {
                            tip.action();
                            handleDismiss();
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Explore →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FirstTimeGuidance;

