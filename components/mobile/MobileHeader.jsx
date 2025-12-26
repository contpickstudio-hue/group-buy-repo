/**
 * MobileHeader Component
 * Reusable sticky header for mobile pages with back button and title
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useSetCurrentScreen } from '../../stores';

const MobileHeader = ({ 
    title, 
    onBack, 
    backScreen = null,
    rightAction = null,
    className = ''
}) => {
    const setCurrentScreen = useSetCurrentScreen();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else if (backScreen) {
            setCurrentScreen(backScreen);
        } else {
            // Default: go back in history or to browse
            if (window.history.length > 1) {
                window.history.back();
            } else {
                setCurrentScreen('browse');
            }
        }
    };

    return (
        <header className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm ${className}`}>
            <div className="flex items-center justify-between px-4 py-3 min-h-[56px] safe-area-inset-top">
                {/* Back Button */}
                <button
                    onClick={handleBack}
                    className="flex items-center justify-center min-w-[44px] min-h-[44px] -ml-2 text-gray-700 hover:text-gray-900 active:scale-95 transition-all"
                    aria-label="Go back"
                >
                    <ArrowLeft size={24} strokeWidth={2} />
                </button>

                {/* Title */}
                <h1 className="flex-1 text-center text-lg font-semibold text-gray-900 truncate px-2">
                    {title}
                </h1>

                {/* Right Action or Spacer */}
                <div className="min-w-[44px] flex items-center justify-end">
                    {rightAction || <div className="w-6" />}
                </div>
            </div>
        </header>
    );
};

export default MobileHeader;

