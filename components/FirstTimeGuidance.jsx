/**
 * First-Time User Guidance Component
 * Shows coach marks/tooltips for first-time users
 */

import React, { useState, useEffect } from 'react';
import { useUser, useCurrentScreen } from '../stores';
import CoachMark from './CoachMark';

const FirstTimeGuidance = () => {
    const user = useUser();
    const currentScreen = useCurrentScreen();
    const [showGuidance, setShowGuidance] = useState(false);
    const [currentCoachMark, setCurrentCoachMark] = useState(null);

    useEffect(() => {
        if (!user) return;

        // Check if user has seen guidance before
        const guidanceShown = sessionStorage.getItem('firstTimeGuidanceShown');
        if (guidanceShown) return;

        // Show guidance based on current screen
        const coachMarks = {
            'groupbuys': 'join-groupbuy-button',
            'errands': 'post-errand-form',
            'browse': 'region-filter'
        };

        const targetId = coachMarks[currentScreen];
        if (targetId) {
            // Wait for page to render
            setTimeout(() => {
                setShowGuidance(true);
                setCurrentCoachMark(targetId);
            }, 500);
        }
    }, [user, currentScreen]);

    const getCoachMessage = (targetId) => {
        const messages = {
            'join-groupbuy-button': 'Tap here to join group buys and save money with your community!',
            'post-errand-form': 'Post an errand here to get help from neighbors or help others.',
            'region-filter': 'Filter by region to find group buys and errands near you.'
        };
        return messages[targetId] || '';
    };

    const handleDismiss = () => {
        sessionStorage.setItem('firstTimeGuidanceShown', 'true');
        setShowGuidance(false);
        setCurrentCoachMark(null);
    };

    if (!showGuidance || !currentCoachMark) return null;

    return (
        <CoachMark
            targetId={currentCoachMark}
            message={getCoachMessage(currentCoachMark)}
            position="bottom"
            onDismiss={handleDismiss}
        />
    );
};

export default FirstTimeGuidance;

