import React from 'react';
import { useUser, useProducts, useOrders, useErrands } from '../stores';

const DashboardPage = () => {
    try {
        const user = useUser();
        const products = useProducts() || [];
        const orders = useOrders() || [];
        const errands = useErrands() || [];

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

            {/* Analytics Placeholder */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">$0.00</div>
                    <div className="text-gray-600">Total Savings</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <div className="text-2xl font-bold text-green-600 mb-2">$0.00</div>
                    <div className="text-gray-600">Total Earnings</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-2">0</div>
                    <div className="text-gray-600">Group Buys Joined</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <div className="text-2xl font-bold text-orange-600 mb-2">0</div>
                    <div className="text-gray-600">Errands Completed</div>
                </div>
            </div>

            {/* Role-specific sections */}
            {roles.includes('vendor') && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-8" data-testid="create-product-form">
                    <h3 className="text-xl font-semibold mb-4">Create Group Buy</h3>
                    <form className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Product Title
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    placeholder="e.g., Premium Korean Strawberries"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Price per Unit ($)
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    min="1"
                                    placeholder="38"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                name="description"
                                rows={3}
                                placeholder="Describe your product..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Region
                                </label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option>Toronto</option>
                                    <option>Hamilton</option>
                                    <option>Niagara</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Target Quantity
                                </label>
                                <input
                                    type="number"
                                    name="targetQuantity"
                                    min="5"
                                    defaultValue="20"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Deadline
                                </label>
                                <input
                                    type="date"
                                    name="deadline"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Create Group Buy
                        </button>
                    </form>
                </div>
            )}

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
