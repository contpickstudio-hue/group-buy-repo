import React from 'react';
import { useUser } from '../stores';
import CreateGroupBuyForm from '../components/CreateGroupBuyForm';
import useAccountSummary from '../hooks/useAccountSummary';

const DashboardPage = () => {
    try {
        const user = useUser();
        const accountSummary = useAccountSummary();

    if (!user) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center">
                    <p className="text-gray-500">Please sign in to view your dashboard.</p>
                </div>
            </div>
        );
    }

    const roles = user.roles || [];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome, {user.name}
                </h2>
                <p className="text-gray-600">
                    Track tasks, payouts, and requests in one place.
                </p>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h3 className="text-xl font-semibold mb-4">Your Account</h3>
                <div className="space-y-2">
                    <p>
                        <strong>Roles:</strong> {roles.map(role => role.toUpperCase()).join(', ')}
                    </p>
                    {roles.includes('helper') && (
                        <p>
                            <strong>Helper Status:</strong> {user.helperVerified ? 'Verified ✅' : 'Pending Verification'}
                        </p>
                    )}
                </div>
            </div>

            {/* Account Summary */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                        ${accountSummary.totalSavings.toFixed(2)}
                    </div>
                    <div className="text-gray-600">Total Savings</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                        ${accountSummary.totalEarnings.toFixed(2)}
                    </div>
                    <div className="text-gray-600">Total Earnings</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-2">
                        {accountSummary.groupBuysJoined}
                    </div>
                    <div className="text-gray-600">Group Buys Joined</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <div className="text-2xl font-bold text-orange-600 mb-2">
                        {accountSummary.errandsCompleted}
                    </div>
                    <div className="text-gray-600">Errands Completed</div>
                </div>
            </div>

            {/* Role-specific sections */}
            {roles.includes('vendor') && <CreateGroupBuyForm />}

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
                <div className="text-center py-8 text-gray-500">
                    <p>No recent activity to show.</p>
                    <p className="text-sm mt-2">Start by joining a group buy or posting an errand!</p>
                </div>
            </div>
        </div>
    );
    } catch (error) {
        console.error('DashboardPage error:', error);
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                        Unable to Load Dashboard
                    </h3>
                    <p className="text-red-600 mb-4">
                        There was an error loading your dashboard. Please try refreshing the page.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                    >
                        Refresh Page
                    </button>
                </div>
            </div>
        );
    }
};

export default DashboardPage;
