/**
 * Coach Mark Component
 * Tooltip/coach mark for first-time user guidance
 * Shows once per session
 */

import React, { useState, useEffect } from 'react';

const CoachMark = ({ 
    targetId, 
    message, 
    position = 'bottom',
    onDismiss 
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [targetElement, setTargetElement] = useState(null);

    useEffect(() => {
        // Check if coach mark was already shown this session
        const sessionKey = `coachMark_${targetId}`;
        const wasShown = sessionStorage.getItem(sessionKey);
        
        if (wasShown) {
            return;
        }

        // Find target element
        const element = document.getElementById(targetId) || 
                      document.querySelector(`[data-coach-target="${targetId}"]`);
        
        if (element) {
            setTargetElement(element);
            setIsVisible(true);
            sessionStorage.setItem(sessionKey, 'true');
        }
    }, [targetId]);

    if (!isVisible || !targetElement) return null;

    const handleDismiss = () => {
        setIsVisible(false);
        if (onDismiss) onDismiss();
    };

    // Calculate position
    const rect = targetElement.getBoundingClientRect();
    const getPositionStyles = () => {
        switch (position) {
            case 'top':
                return {
                    bottom: window.innerHeight - rect.top + 8,
                    left: rect.left + rect.width / 2,
                    transform: 'translateX(-50%)'
                };
            case 'right':
                return {
                    top: rect.top + rect.height / 2,
                    left: rect.right + 12,
                    transform: 'translateY(-50%)'
                };
            case 'left':
                return {
                    top: rect.top + rect.height / 2,
                    right: window.innerWidth - rect.left + 12,
                    transform: 'translateY(-50%)'
                };
            default: // bottom
                return {
                    top: rect.bottom + 8,
                    left: rect.left + rect.width / 2,
                    transform: 'translateX(-50%)'
                };
        }
    };

    return (
        <div className="fixed z-50 pointer-events-none" style={getPositionStyles()}>
            <div className="bg-gray-900 text-white rounded-lg p-4 shadow-xl max-w-[280px] pointer-events-auto relative">
                <div className="text-sm leading-relaxed mb-3">
                    {message}
                </div>
                <button
                    onClick={handleDismiss}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm min-h-[44px]"
                >
                    Got it!
                </button>
                {/* Arrow */}
                <div className={`absolute ${
                    position === 'top' ? 'top-full left-1/2 -translate-x-1/2 border-t-gray-900' :
                    position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900' :
                    position === 'right' ? 'right-full top-1/2 -translate-y-1/2 border-r-gray-900' :
                    'left-full top-1/2 -translate-y-1/2 border-l-gray-900'
                }`}>
                    <div className={`w-0 h-0 border-8 ${
                        position === 'top' ? 'border-t-gray-900 border-l-transparent border-r-transparent border-b-transparent' :
                        position === 'bottom' ? 'border-b-gray-900 border-l-transparent border-r-transparent border-t-transparent' :
                        position === 'right' ? 'border-r-gray-900 border-t-transparent border-b-transparent border-l-transparent' :
                        'border-l-gray-900 border-t-transparent border-b-transparent border-r-transparent'
                    }`}></div>
                </div>
            </div>
        </div>
    );
};

export default CoachMark;

