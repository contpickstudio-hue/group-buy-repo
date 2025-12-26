/**
 * Errand Detail Page
 * Mobile-optimized full-screen page for errand details
 */

import React, { useState, useEffect } from 'react';
import { useErrands, useUser, useSetCurrentScreen } from '../stores';
import MobileHeader from '../components/mobile/MobileHeader';
import toast from 'react-hot-toast';

const ErrandDetailPage = () => {
    const [errandId, setErrandId] = useState(null);
    const errands = useErrands();
    const user = useUser();
    const setCurrentScreen = useSetCurrentScreen();
    const [isApplying, setIsApplying] = useState(false);

    // Get errand ID from URL hash (format: #errand/123)
    useEffect(() => {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#errand/')) {
            const id = hash.replace('#errand/', '');
            setErrandId(id);
        }
    }, []);

    // Listen for hash changes
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash && hash.startsWith('#errand/')) {
                const id = hash.replace('#errand/', '');
                setErrandId(id);
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const errand = errands.find(e => String(e.id) === String(errandId));

    if (!errandId || !errand) {
        return (
            <div className="min-h-screen bg-gray-50">
                <MobileHeader title="Errand Not Found" backScreen="errands" />
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="bg-white rounded-xl shadow-md p-6 text-center">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Errand Not Found</h2>
                        <p className="text-gray-600 mb-4">The errand you're looking for doesn't exist.</p>
                        <button
                            onClick={() => setCurrentScreen('errands')}
                            className="btn-primary"
                        >
                            Back to Errands
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const deadline = errand.deadline ? new Date(errand.deadline) : null;
    const daysLeft = deadline ? Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)) : null;
    const isExpired = daysLeft !== null && daysLeft <= 0;
    const isCompleted = errand.status === 'completed';
    const isCancelled = errand.status === 'cancelled';
    const isMyErrand = user && (errand.requesterEmail === user.email || errand.requesterEmail === user.id);

    const handleApplyToHelp = async () => {
        if (!user) {
            toast.error('Please sign in to apply');
            setCurrentScreen('auth');
            return;
        }

        if (isMyErrand) {
            toast.error('You cannot apply to your own errand');
            return;
        }

        setIsApplying(true);
        try {
            // TODO: Implement application logic
            toast.success('Application submitted! The requester will be notified.');
        } catch (error) {
            toast.error('Failed to submit application');
        } finally {
            setIsApplying(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 sm:pb-8">
            {/* Mobile Header */}
            <MobileHeader 
                title="Errand Details" 
                backScreen="errands"
            />

            <div className="max-w-4xl mx-auto px-4 pt-4">
                {/* Errand Card */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden mb-4">
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <h1 className="text-2xl sm:text-3xl font-bold mb-2 leading-tight">
                                    {errand.title}
                                </h1>
                                <div className="flex items-center gap-3 text-sm opacity-90">
                                    <span className="flex items-center gap-1">
                                        <span>📍</span>
                                        {errand.region}
                                    </span>
                                    {deadline && (
                                        <span className="flex items-center gap-1">
                                            <span>⏰</span>
                                            {deadline.toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl sm:text-4xl font-bold">
                                    ${errand.budget || 0}
                                </div>
                                <div className="text-sm opacity-90">Budget</div>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                            {isCompleted && (
                                <span className="px-3 py-1 bg-green-500/20 text-green-100 rounded-full text-sm font-semibold">
                                    ✓ Completed
                                </span>
                            )}
                            {isCancelled && (
                                <span className="px-3 py-1 bg-red-500/20 text-red-100 rounded-full text-sm font-semibold">
                                    ✗ Cancelled
                                </span>
                            )}
                            {isExpired && !isCompleted && !isCancelled && (
                                <span className="px-3 py-1 bg-orange-500/20 text-orange-100 rounded-full text-sm font-semibold">
                                    ⏰ Expired
                                </span>
                            )}
                            {!isExpired && !isCompleted && !isCancelled && (
                                <span className="px-3 py-1 bg-blue-500/20 text-blue-100 rounded-full text-sm font-semibold">
                                    🔵 Open
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-4 sm:p-6">
                        {/* Description */}
                        <div className="mb-6">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Description</h2>
                            <p className="text-base sm:text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {errand.description || 'No description provided.'}
                            </p>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="text-sm text-gray-600 mb-1">Region</div>
                                <div className="text-lg font-semibold text-gray-900">{errand.region}</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="text-sm text-gray-600 mb-1">Budget</div>
                                <div className="text-lg font-semibold text-green-600">${errand.budget || 0}</div>
                            </div>
                            {deadline && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="text-sm text-gray-600 mb-1">Deadline</div>
                                    <div className="text-lg font-semibold text-gray-900">
                                        {deadline.toLocaleDateString()}
                                        {daysLeft !== null && (
                                            <span className={`ml-2 text-sm ${daysLeft <= 3 ? 'text-red-600' : 'text-gray-600'}`}>
                                                ({daysLeft} days left)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="text-sm text-gray-600 mb-1">Status</div>
                                <div className="text-lg font-semibold text-gray-900 capitalize">
                                    {errand.status || 'Open'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Desktop CTA */}
                {!isExpired && !isCompleted && !isCancelled && !isMyErrand && (
                    <div className="hidden md:block bg-white rounded-xl shadow-md p-6">
                        <button
                            onClick={handleApplyToHelp}
                            disabled={isApplying}
                            className="w-full btn-primary text-lg py-4"
                        >
                            {isApplying ? 'Applying...' : 'Apply to Help'}
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile Sticky CTA Button */}
            {!isExpired && !isCompleted && !isCancelled && !isMyErrand && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 md:hidden shadow-lg safe-area-inset-bottom">
                    <button
                        onClick={handleApplyToHelp}
                        disabled={isApplying}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-colors font-semibold text-lg min-h-[56px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isApplying ? 'Applying...' : `Apply to Help - $${errand.budget || 0}`}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ErrandDetailPage;

