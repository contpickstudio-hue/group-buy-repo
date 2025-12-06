/**
 * Payout Settings Page
 * Allows vendors to connect their Stripe account for payouts
 */

import React, { useState, useEffect } from 'react';
import { useUser } from '../stores';
import { 
    getStripeConnectAccountStatus, 
    createStripeConnectAccount 
} from '../services/stripeConnectService';
import { supabaseClient } from '../services/supabaseService';

const PayoutSettingsPage = () => {
    const user = useUser();
    const [loading, setLoading] = useState(false);
    const [accountStatus, setAccountStatus] = useState({
        connected: false,
        status: 'not_connected',
        accountId: null
    });

    useEffect(() => {
        if (user?.email) {
            loadAccountStatus();
        }
    }, [user]);

    const loadAccountStatus = async () => {
        try {
            setLoading(true);
            const result = await getStripeConnectAccountStatus(user.email);
            if (result.success) {
                setAccountStatus(result.data);
            }
        } catch (error) {
            console.error('Failed to load account status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectStripe = async () => {
        try {
            setLoading(true);
            const result = await createStripeConnectAccount(user.email);
            
            if (result.success && result.data.onboardingUrl) {
                // Redirect to Stripe onboarding
                window.location.href = result.data.onboardingUrl;
            } else {
                alert('Failed to create Stripe account. Please try again.');
            }
        } catch (error) {
            console.error('Failed to connect Stripe:', error);
            alert(`Error: ${error.message || 'Failed to connect Stripe account'}`);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <p className="text-gray-500">Please sign in to manage payout settings.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold mb-6">Payout Settings</h2>

            <div className="bg-white rounded-lg shadow-md p-6">
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading...</p>
                    </div>
                ) : accountStatus.connected ? (
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="font-semibold text-green-700">Stripe Account Connected</span>
                        </div>
                        <p className="text-gray-600">
                            Your Stripe account is active and ready to receive payouts.
                        </p>
                        <p className="text-sm text-gray-500">
                            Account ID: {accountStatus.accountId}
                        </p>
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <strong>How it works:</strong> When customers purchase your products, 
                                payments are automatically split. You receive your portion (after platform fees) 
                                directly to your connected Stripe account.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <span className="font-semibold text-yellow-700">Stripe Account Not Connected</span>
                        </div>
                        <p className="text-gray-600">
                            Connect your Stripe account to start receiving payouts from sales.
                        </p>
                        <button
                            onClick={handleConnectStripe}
                            disabled={loading}
                            className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Connecting...' : 'Connect Stripe Account'}
                        </button>
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                                <strong>What you'll need:</strong>
                            </p>
                            <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
                                <li>Business information (name, address)</li>
                                <li>Bank account details for payouts</li>
                                <li>Tax identification number (if applicable)</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            {/* Platform Fee Information */}
            <div className="mt-6 bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Platform Fees</h3>
                <p className="text-gray-600 mb-2">
                    Platform fee: <strong>15%</strong> per transaction
                </p>
                <p className="text-sm text-gray-500">
                    This fee covers payment processing, platform maintenance, and customer support.
                    You receive <strong>85%</strong> of each sale directly to your Stripe account.
                </p>
            </div>
        </div>
    );
};

export default PayoutSettingsPage;

