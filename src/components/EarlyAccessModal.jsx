import React, { useState } from 'react';
import { X, Mail, Sparkles } from 'lucide-react';
import { useSetCurrentScreen } from '../stores';
import { useTranslation } from '../contexts/TranslationProvider';
import toast from 'react-hot-toast';

/**
 * Early Access Modal
 * Allows users to join the waitlist without creating a full account
 * Early Access = Waitlist or limited preview
 */
const EarlyAccessModal = ({ isOpen, onClose, onJoinWaitlist }) => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const setCurrentScreen = useSetCurrentScreen();

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email || !email.includes('@')) {
            toast.error(t('earlyAccess.invalidEmail', null, 'Please enter a valid email address'));
            return;
        }

        setIsSubmitting(true);
        try {
            // Store email in localStorage for now (can be extended to API)
            const waitlist = JSON.parse(localStorage.getItem('earlyAccessWaitlist') || '[]');
            if (!waitlist.includes(email)) {
                waitlist.push({
                    email,
                    timestamp: new Date().toISOString()
                });
                localStorage.setItem('earlyAccessWaitlist', JSON.stringify(waitlist));
            }
            
            toast.success(t('earlyAccess.waitlistJoined', null, 'You\'re on the list! We\'ll notify you when early access is available.'));
            setEmail('');
            onClose();
            
            // Optionally redirect to signup for full access
            if (onJoinWaitlist) {
                onJoinWaitlist();
            }
        } catch (error) {
            toast.error(t('earlyAccess.joinFailed', null, 'Failed to join waitlist. Please try again.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGetFullAccess = () => {
        onClose();
        setCurrentScreen('auth');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 rounded-full p-2">
                            <Sparkles className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {t('earlyAccess.title', null, 'Join Early Access')}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Explanation */}
                    <div className="mb-6">
                        <p className="text-gray-600 mb-4">
                            {t('earlyAccess.description', null, 'Join our early access waitlist to be notified when group buys and errands become available in your area.')}
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                                {t('earlyAccess.differenceTitle', null, 'What\'s the difference?')}
                            </h3>
                            <ul className="space-y-2 text-sm text-gray-700">
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 mt-0.5">•</span>
                                    <span>
                                        <strong>{t('earlyAccess.waitlistLabel', null, 'Early Access (Waitlist):')}</strong>{' '}
                                        {t('earlyAccess.waitlistDescription', null, 'Get notified when services launch in your area. No account required.')}
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 mt-0.5">•</span>
                                    <span>
                                        <strong>{t('earlyAccess.fullAccessLabel', null, 'Full Access (Sign Up):')}</strong>{' '}
                                        {t('earlyAccess.fullAccessDescription', null, 'Create an account to join group buys, post errands, and access all features immediately.')}
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Waitlist Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="waitlist-email" className="block text-sm font-medium text-gray-700 mb-2">
                                {t('earlyAccess.emailLabel', null, 'Email Address')}
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    id="waitlist-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('earlyAccess.emailPlaceholder', null, 'your@email.com')}
                                    required
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 text-white py-3.5 rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center">
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                                    {t('earlyAccess.joining', null, 'Joining...')}
                                </span>
                            ) : (
                                t('earlyAccess.joinWaitlist', null, 'Join Waitlist')
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">
                                    {t('earlyAccess.or', null, 'or')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Full Access CTA */}
                    <button
                        onClick={handleGetFullAccess}
                        className="w-full bg-gray-100 text-gray-900 py-3.5 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                    >
                        {t('earlyAccess.getFullAccess', null, 'Create Account for Full Access')}
                    </button>

                    <p className="mt-4 text-xs text-gray-500 text-center">
                        {t('earlyAccess.privacy', null, 'We\'ll only use your email to notify you about early access. Unsubscribe anytime.')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EarlyAccessModal;

