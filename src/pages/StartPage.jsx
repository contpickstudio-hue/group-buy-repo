import React from 'react';
import { useSetCurrentScreen, useSetDemoUser } from '../stores';

const StartPage = () => {
    const setCurrentScreen = useSetCurrentScreen();
    const setDemoUser = useSetDemoUser();

    const handleGetStarted = () => {
        setCurrentScreen('auth');
    };

    const handleSkipLogin = () => {
        // Set demo user for testing
        setDemoUser();
        setCurrentScreen('browse');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
            <div className="max-w-4xl mx-auto text-center">
                {/* Hero Section */}
                <div className="mb-12">
                    <p className="text-lg text-gray-600 mb-4">
                        Community-powered commerce for Koreans in Canada
                    </p>
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                        Join local group buys & errands together
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Connect with your community through group purchases and local errands. 
                        Save money, help neighbors, and build stronger communities.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                    <button
                        onClick={handleGetStarted}
                        className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                    >
                        Get Started
                    </button>
                    <button
                        onClick={handleSkipLogin}
                        className="px-6 py-3 bg-white text-gray-700 text-lg font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                        Skip login (test)
                    </button>
                </div>

                {/* Features Preview */}
                <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <div className="text-3xl mb-4">🛒</div>
                        <h3 className="text-xl font-semibold mb-2">Group Buys</h3>
                        <p className="text-gray-600">
                            Join bulk purchases to get better prices on Korean groceries and products.
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <div className="text-3xl mb-4">🤝</div>
                        <h3 className="text-xl font-semibold mb-2">Community Errands</h3>
                        <p className="text-gray-600">
                            Help neighbors with tasks or get help with your own errands.
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <div className="text-3xl mb-4">📊</div>
                        <h3 className="text-xl font-semibold mb-2">Analytics & Insights</h3>
                        <p className="text-gray-600">
                            Track your savings, earnings, and community impact with detailed analytics.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StartPage;
