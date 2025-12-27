import React from 'react';
import { useUser, useSetCurrentScreen, useProducts, useErrands } from '../stores';
import { ShoppingCart, Package, ArrowRight, Users, Sparkles } from 'lucide-react';

const StartPage = () => {
    const user = useUser();
    const setCurrentScreen = useSetCurrentScreen();
    const products = useProducts();
    const errands = useErrands();

    const featuredProducts = products.slice(0, 3);
    const featuredErrands = errands.slice(0, 3);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Hero Section */}
            <div className="text-center mb-12 sm:mb-16 animate-fade-in">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-sm font-semibold mb-4">
                    <Sparkles className="w-4 h-4 mr-2" />
                    <span>Korean Community Commerce Platform</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                    Connect, Shop, & Save Together
                </h1>
                <p className="text-gray-600 text-lg sm:text-xl max-w-3xl mx-auto mb-8 px-4">
                    Join group buys, request errands, and build a stronger Korean community in your area.
                </p>
                {!user && (
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={() => setCurrentScreen('auth')}
                            className="btn-primary px-8 py-4 text-lg flex items-center gap-2 group"
                        >
                            Get Started
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={() => setCurrentScreen('browse')}
                            className="btn-secondary px-8 py-4 text-lg"
                        >
                            Browse Marketplace
                        </button>
                    </div>
                )}
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16">
                {/* Group Buys Feature */}
                <div 
                    className="card card-hover cursor-pointer"
                    onClick={() => setCurrentScreen('groupbuys')}
                >
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <ShoppingCart className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Group Buys</h2>
                            <p className="text-gray-600 mb-4">
                                Join collective purchases and save money by buying in bulk with your community.
                            </p>
                            <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 group">
                                Explore Group Buys
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                    {featuredProducts.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <p className="text-sm text-gray-500 mb-3">Featured:</p>
                            <div className="space-y-2">
                                {featuredProducts.slice(0, 2).map((product) => (
                                    <div key={product.id} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-700 font-medium">{product.title}</span>
                                        <span className="text-blue-600 font-semibold">${product.price}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Errands Feature */}
                <div 
                    className="card card-hover cursor-pointer"
                    onClick={() => setCurrentScreen('errands')}
                >
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <Package className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Errands</h2>
                            <p className="text-gray-600 mb-4">
                                Request help with tasks or offer your services to the community.
                            </p>
                            <button className="text-green-600 hover:text-green-700 font-medium flex items-center gap-1 group">
                                Explore Errands
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                    {featuredErrands.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <p className="text-sm text-gray-500 mb-3">Open requests:</p>
                            <div className="space-y-2">
                                {featuredErrands.slice(0, 2).map((errand) => (
                                    <div key={errand.id} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-700 font-medium">{errand.title}</span>
                                        <span className="text-green-600 font-semibold">${errand.budget}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Community Stats */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 sm:p-12 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Users className="w-6 h-6 text-blue-600" />
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Join Our Community</h2>
                </div>
                <p className="text-gray-600 text-lg mb-6 max-w-2xl mx-auto">
                    Connect with Korean community members in your area. Together we can save money, help each other, and build a stronger community.
                </p>
                {!user && (
                    <button
                        onClick={() => setCurrentScreen('auth')}
                        className="btn-primary px-8 py-3 text-base"
                    >
                        Sign Up Free
                    </button>
                )}
            </div>
        </div>
    );
};

export default StartPage;

