/**
 * Errand Detail Page
 * Full errand lifecycle: apply, accept, confirm completion, rate
 */

import React, { useState, useEffect } from 'react';
import { 
  useErrands, 
  useUser, 
  useSetCurrentScreen,
  useApplications,
  useAddApplication,
  useAcceptHelperApplication,
  useConfirmErrandCompletion,
  useRateHelper,
  useLoadErrands
} from '../stores';
import { getHelperActiveErrandCount, getMaxActiveErrandsPerHelper } from '../services/errandService';
import MobileHeader from '../components/mobile/MobileHeader';
import ReportButton from '../components/ReportButton';
import { checkErrandSuspension } from '../services/moderationService';
import { CheckCircle, Clock, User, Star, AlertCircle, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { t } from '../utils/translations';

const ErrandDetailPage = () => {
    const [errandId, setErrandId] = useState(null);
    const errands = useErrands();
    const applications = useApplications();
    const user = useUser();
    const setCurrentScreen = useSetCurrentScreen();
    const addApplication = useAddApplication();
    const acceptHelperApplication = useAcceptHelperApplication();
    const confirmErrandCompletion = useConfirmErrandCompletion();
    const rateHelper = useRateHelper();
    const loadErrands = useLoadErrands();
    
    const [isApplying, setIsApplying] = useState(false);
    const [showApplicationForm, setShowApplicationForm] = useState(false);
    const [applicationData, setApplicationData] = useState({ offerAmount: '', message: '' });
    const [showRatingForm, setShowRatingForm] = useState(false);
    const [ratingData, setRatingData] = useState({ rating: 5, comment: '' });
    const [helperActiveCount, setHelperActiveCount] = useState(null);
    const [isSuspended, setIsSuspended] = useState(false);
    const [suspension, setSuspension] = useState(null);

    // Get errand ID from URL hash
    useEffect(() => {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#errand/')) {
            const id = hash.replace('#errand/', '');
            setErrandId(id);
        }
    }, []);

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
    const isMyErrand = user && errand && (errand.requesterEmail === user.email || errand.requesterEmail === user.id);

    // Load helper active count if user is a helper
    useEffect(() => {
        if (user && errand && !isMyErrand) {
            getHelperActiveErrandCount(user.email || user.id).then(result => {
                if (result.success) {
                    setHelperActiveCount(result.count);
                }
            });
        }
    }, [user, errand, isMyErrand]);

    const errandApplications = errand ? applications.filter(a => a.errandId === errand.id) : [];
    const myApplication = user ? errandApplications.find(a => a.helperEmail === (user.email || user.id)) : null;
    const acceptedApplication = errandApplications.find(a => a.status === 'accepted');

    // Show suspension notice if suspended
    if (isSuspended && errand) {
        return (
            <div className="min-h-screen bg-gray-50 pb-24 sm:pb-8">
                <MobileHeader title="Errand Details" backScreen="errands" />
                <div className="max-w-4xl mx-auto px-4 pt-4">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertCircle className="text-red-600" size={24} />
                            <h2 className="text-xl font-semibold text-gray-900">This Errand Has Been Suspended</h2>
                        </div>
                        {suspension && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-red-800">
                                    <strong>Reason:</strong> {suspension.reason}
                                </p>
                                {suspension.admin_notes && (
                                    <p className="text-sm text-red-700 mt-2">{suspension.admin_notes}</p>
                                )}
                            </div>
                        )}
                        <button
                            onClick={() => setCurrentScreen('errands')}
                            className="bg-blue-600 text-white px-6 py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
                        >
                            Back to Errands
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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
                            className="btn-secondary"
                        >
                            {t('errand.backToErrands', null, 'Back to Errands')}
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
    const isAssigned = errand.status === 'assigned' || errand.status === 'in_progress' || errand.assignedHelperEmail;
    const isAwaitingConfirmation = errand.status === 'awaiting_confirmation';
    const isLocked = errand.assignedHelperEmail || errand.status === 'assigned' || errand.status === 'in_progress' || errand.status === 'awaiting_confirmation' || errand.status === 'completed';
    const isAssignedHelper = user && errand.assignedHelperEmail && 
        (errand.assignedHelperEmail === user.email || errand.assignedHelperEmail === user.id);
    const canApply = !isMyErrand && !isLocked && !isCompleted && !isCancelled && !myApplication && errand.status === 'open';
    const maxActive = getMaxActiveErrandsPerHelper();
    const canApplyDueToLimit = helperActiveCount === null || helperActiveCount < maxActive;

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

        if (!canApplyDueToLimit) {
            toast.error(`You can only have ${maxActive} active errands at a time`);
            return;
        }

        setIsApplying(true);
        try {
            const helperEmail = user.email || user.id;
            const offerAmount = applicationData.offerAmount ? parseFloat(applicationData.offerAmount) : null;
            const result = await addApplication(errand.id, helperEmail, offerAmount, applicationData.message);
            
            if (result.success) {
                toast.success('Application submitted! The requester will be notified.');
                setShowApplicationForm(false);
                setApplicationData({ offerAmount: '', message: '' });
                await loadErrands();
            } else {
                throw new Error(result.error || 'Failed to submit application');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to submit application');
        } finally {
            setIsApplying(false);
        }
    };

    const handleAcceptHelper = async (applicationId) => {
        if (!user) return;
        
        try {
            const requesterEmail = user.email || user.id;
            const result = await acceptHelperApplication(errand.id, applicationId, requesterEmail);
            
            if (result.success) {
                toast.success('Helper accepted! Errand is now locked.');
                await loadErrands();
            } else {
                throw new Error(result.error || 'Failed to accept helper');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to accept helper');
        }
    };

    const handleConfirmCompletion = async (isRequester) => {
        if (!user) return;
        
        try {
            const userEmail = user.email || user.id;
            const result = await confirmErrandCompletion(errand.id, userEmail, isRequester);
            
            if (result.success) {
                if (result.bothConfirmed) {
                    toast.success('Both parties confirmed! Payment will be released.');
                    // Release payment
                    const { releaseErrandPayment } = await import('../services/errandService');
                    await releaseErrandPayment(errand.id);
                } else {
                    toast.success('Completion confirmed! Waiting for other party...');
                }
                await loadErrands();
            } else {
                throw new Error(result.error || 'Failed to confirm completion');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to confirm completion');
        }
    };

    const handleRateHelper = async () => {
        if (!user) return;
        
        try {
            const raterEmail = user.email || user.id;
            const result = await rateHelper(errand.id, raterEmail, ratingData.rating, ratingData.comment);
            
            if (result.success) {
                toast.success('Rating submitted!');
                setShowRatingForm(false);
                setRatingData({ rating: 5, comment: '' });
            } else {
                throw new Error(result.error || 'Failed to submit rating');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to submit rating');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 sm:pb-8">
            <MobileHeader title="Errand Details" backScreen="errands" />

            <div className="max-w-4xl mx-auto px-4 pt-4">
                {/* Errand Card */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden mb-4">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <h1 className="text-2xl sm:text-3xl font-bold mb-2 leading-tight">
                                    {errand.title}
                                </h1>
                                <div className="flex items-center gap-3 text-sm opacity-90">
                                    <span>📍 {errand.region}</span>
                                    {deadline && <span>⏰ {deadline.toLocaleDateString()}</span>}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="text-right">
                                    <div className="text-3xl sm:text-4xl font-bold">
                                        ${errand.budget || 0}
                                    </div>
                                    <div className="text-sm opacity-90">Budget</div>
                                </div>
                                <div className="mt-2">
                                    <ReportButton
                                        reportType="errand"
                                        targetId={errand.id}
                                        targetTitle={errand.title}
                                        className="text-white hover:text-red-200 hover:bg-red-500/20"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {isCompleted && (
                                <span className="px-3 py-1 bg-green-500/20 text-green-100 rounded-full text-sm font-semibold">
                                    ✓ Completed
                                </span>
                            )}
                            {isAssigned && !isCompleted && (
                                <span className="px-3 py-1 bg-blue-500/20 text-blue-100 rounded-full text-sm font-semibold flex items-center gap-1">
                                    <Lock size={14} />
                                    Assigned
                                </span>
                            )}
                            {isAwaitingConfirmation && (
                                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-100 rounded-full text-sm font-semibold">
                                    ⏳ Awaiting Confirmation
                                </span>
                            )}
                            {isCancelled && (
                                <span className="px-3 py-1 bg-red-500/20 text-red-100 rounded-full text-sm font-semibold">
                                    ✗ Cancelled
                                </span>
                            )}
                            {!isAssigned && !isCompleted && !isCancelled && (
                                <span className="px-3 py-1 bg-blue-500/20 text-blue-100 rounded-full text-sm font-semibold">
                                    🔵 Open
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="p-4 sm:p-6">
                        <div className="mb-6">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Description</h2>
                            <p className="text-base sm:text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {errand.description || 'No description provided.'}
                            </p>
                        </div>

                        {/* Assigned Helper Info */}
                        {isAssigned && errand.assignedHelperEmail && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <User size={18} className="text-blue-600" />
                                    <span className="font-semibold text-blue-900">Assigned Helper</span>
                                </div>
                                <p className="text-sm text-blue-800">{errand.assignedHelperEmail}</p>
                            </div>
                        )}

                        {/* Completion Status */}
                        {isAwaitingConfirmation && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock size={18} className="text-yellow-600" />
                                    <span className="font-semibold text-yellow-900">Completion Status</span>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        {errand.requesterConfirmedCompletion ? (
                                            <CheckCircle size={16} className="text-green-600" />
                                        ) : (
                                            <Clock size={16} className="text-gray-400" />
                                        )}
                                        <span className={errand.requesterConfirmedCompletion ? 'text-green-800' : 'text-gray-600'}>
                                            Requester: {errand.requesterConfirmedCompletion ? 'Confirmed' : 'Pending'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {errand.helperConfirmedCompletion ? (
                                            <CheckCircle size={16} className="text-green-600" />
                                        ) : (
                                            <Clock size={16} className="text-gray-400" />
                                        )}
                                        <span className={errand.helperConfirmedCompletion ? 'text-green-800' : 'text-gray-600'}>
                                            Helper: {errand.helperConfirmedCompletion ? 'Confirmed' : 'Pending'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Requester Actions */}
                        {isMyErrand && (
                            <div className="space-y-4">
                                {/* Applications List */}
                                {errand.status === 'open' && errandApplications.length > 0 && (
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <h3 className="font-semibold text-gray-900 mb-3">Applications ({errandApplications.length})</h3>
                                        <div className="space-y-3">
                                            {errandApplications.filter(a => a.status === 'pending').map(app => (
                                                <div key={app.id} className="bg-gray-50 rounded-lg p-3">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <p className="font-medium text-gray-900">{app.helperEmail}</p>
                                                            {app.offerAmount > 0 && (
                                                                <p className="text-sm text-gray-600">Offer: ${app.offerAmount.toFixed(2)}</p>
                                                            )}
                                                            {app.message && (
                                                                <p className="text-sm text-gray-700 mt-1">{app.message}</p>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => handleAcceptHelper(app.id)}
                                                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                                                        >
                                                            Accept
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Confirm Completion (Requester) */}
                                {isAssigned && !errand.requesterConfirmedCompletion && (
                                    <button
                                        onClick={() => handleConfirmCompletion(true)}
                                        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={20} />
                                        Confirm Completion
                                    </button>
                                )}

                                {/* Rate Helper (After Completion) */}
                                {isCompleted && !showRatingForm && (
                                    <button
                                        onClick={() => setShowRatingForm(true)}
                                        className="w-full btn-primary flex items-center justify-center gap-2"
                                    >
                                        <Star size={20} />
                                        {t('errand.rateHelper', null, 'Rate Helper')}
                                    </button>
                                )}

                                {/* Rating Form */}
                                {showRatingForm && (
                                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <h3 className="font-semibold text-gray-900 mb-3">{t('errand.rateHelper', null, 'Rate Helper')}</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Rating (1-5)
                                                </label>
                                                <select
                                                    value={ratingData.rating}
                                                    onChange={(e) => setRatingData({ ...ratingData, rating: parseInt(e.target.value) })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                >
                                                    {[5, 4, 3, 2, 1].map(r => (
                                                        <option key={r} value={r}>{r} {r === 5 ? '⭐' : ''}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Comment (optional)
                                                </label>
                                                <textarea
                                                    value={ratingData.comment}
                                                    onChange={(e) => setRatingData({ ...ratingData, comment: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                    rows={3}
                                                    placeholder="Share your experience..."
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleRateHelper}
                                                    className="btn-primary"
                                                >
                                                    {t('errand.submitRating', null, 'Submit Rating')}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowRatingForm(false);
                                                        setRatingData({ rating: 5, comment: '' });
                                                    }}
                                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Helper Actions */}
                        {isAssignedHelper && (
                            <div className="space-y-4">
                                {/* Confirm Completion (Helper) */}
                                {!errand.helperConfirmedCompletion && (
                                    <button
                                        onClick={() => handleConfirmCompletion(false)}
                                        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={20} />
                                        Confirm Completion
                                    </button>
                                )}

                                {errand.helperConfirmedCompletion && !errand.requesterConfirmedCompletion && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <p className="text-sm text-yellow-800">
                                            You've confirmed completion. Waiting for requester confirmation...
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Application Form (Helper) */}
                        {canApply && (
                            <div className="space-y-4">
                                {!showApplicationForm ? (
                                    <button
                                        onClick={() => setShowApplicationForm(true)}
                                        className="w-full btn-primary"
                                    >
                                        {t('errand.applyToHelp', null, 'Apply to Help')}
                                    </button>
                                ) : (
                                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <h3 className="font-semibold text-gray-900 mb-3">{t('errand.applyToHelp', null, 'Apply to Help')}</h3>
                                        {!canApplyDueToLimit && (
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 flex items-start gap-2">
                                                <AlertCircle size={18} className="text-red-600 mt-0.5" />
                                                <div className="text-sm text-red-800">
                                                    <p className="font-medium">Active Errand Limit Reached</p>
                                                    <p>You currently have {helperActiveCount} active errands. Maximum: {maxActive}</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Offer Amount (optional)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={applicationData.offerAmount}
                                                    onChange={(e) => setApplicationData({ ...applicationData, offerAmount: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                    placeholder="Leave empty to accept budget"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Message (optional)
                                                </label>
                                                <textarea
                                                    value={applicationData.message}
                                                    onChange={(e) => setApplicationData({ ...applicationData, message: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                    rows={3}
                                                    placeholder="Tell the requester why you're a good fit..."
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleApplyToHelp}
                                                    disabled={isApplying || !canApplyDueToLimit}
                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isApplying ? 'Applying...' : 'Submit Application'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowApplicationForm(false);
                                                        setApplicationData({ offerAmount: '', message: '' });
                                                    }}
                                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Application Status (Helper) */}
                        {myApplication && (
                            <div className={`border rounded-lg p-4 ${
                                myApplication.status === 'accepted' ? 'bg-green-50 border-green-200' :
                                myApplication.status === 'rejected' ? 'bg-red-50 border-red-200' :
                                'bg-yellow-50 border-yellow-200'
                            }`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {myApplication.status === 'accepted' && <CheckCircle size={18} className="text-green-600" />}
                                    {myApplication.status === 'rejected' && <AlertCircle size={18} className="text-red-600" />}
                                    {myApplication.status === 'pending' && <Clock size={18} className="text-yellow-600" />}
                                    <span className="font-semibold">
                                        {myApplication.status === 'accepted' ? 'Application Accepted!' :
                                         myApplication.status === 'rejected' ? 'Application Rejected' :
                                         'Application Pending'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700">
                                    {myApplication.status === 'accepted' && 'You have been assigned to this errand.'}
                                    {myApplication.status === 'rejected' && 'The requester chose another helper.'}
                                    {myApplication.status === 'pending' && 'Waiting for requester to review your application.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ErrandDetailPage;
