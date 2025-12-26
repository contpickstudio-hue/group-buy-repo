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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-8 sm:py-12">
            <div className="max-w-4xl mx-auto text-center animate-fade-in">
                {/* Hero Section - Mobile optimized */}
                <div className="mb-10 sm:mb-12">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-blue-200 mb-6 shadow-sm">
                        <span className="text-sm font-semibold text-blue-700">
                            Community-powered commerce for Koreans in Canada
                        </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight px-2">
                        Join local group buys & errands together
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4 leading-relaxed">
                        Connect with your community through group purchases and local errands. 
                        Save money, help neighbors, and build stronger communities.
                    </p>
                </div>

                {/* Action Buttons - Mobile optimized */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center mb-10 sm:mb-12 px-4">
                    <button
                        onClick={handleGetStarted}
                        className="btn-primary text-base sm:text-lg px-8 py-4 sm:py-4 w-full sm:w-auto"
                    >
                        Get Started
                    </button>
                    <button
                        onClick={handleSkipLogin}
                        className="btn-secondary text-base sm:text-lg px-6 py-3 sm:py-4 w-full sm:w-auto"
                    >
                        Skip login (test)
                    </button>
                </div>

                {/* Features Preview - Mobile optimized */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto px-4">
                    <div className="card card-hover animate-scale-in" style={{ animationDelay: '0.1s' }}>
                        <div className="text-4xl sm:text-5xl mb-4">🛒</div>
                        <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">Group Buys</h3>
                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                            Join bulk purchases to get better prices on Korean groceries and products.
                        </p>
                    </div>
                    <div className="card card-hover animate-scale-in" style={{ animationDelay: '0.2s' }}>
                        <div className="text-4xl sm:text-5xl mb-4">🤝</div>
                        <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">Community Errands</h3>
                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                            Help neighbors with tasks or get help with your own errands.
                        </p>
                    </div>
                    <div className="card card-hover animate-scale-in" style={{ animationDelay: '0.3s' }}>
                        <div className="text-4xl sm:text-5xl mb-4">📊</div>
                        <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">Analytics & Insights</h3>
                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                            Track your savings, earnings, and community impact with detailed analytics.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StartPage;
