import React from 'react';
import { useProducts, useErrands, useSetCurrentScreen } from '../stores';

const BrowsePage = () => {
    const products = useProducts();
    const errands = useErrands();
    const setCurrentScreen = useSetCurrentScreen();

    const featuredProducts = products.slice(0, 3);
    const featuredErrands = errands.slice(0, 3);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Hero Section - Mobile optimized */}
            <div className="text-center mb-8 sm:mb-12 animate-fade-in">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-3">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse-slow"></span>
                    Live marketplace
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
                    Browse group buys & errands
                </h1>
                <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto px-4">
                    Discover what the community is organizing right now.
                </p>
            </div>

            {/* Featured Group Buys */}
            <div className="mb-10 sm:mb-12 animate-slide-up">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Featured Group Buys</h2>
                    <button
                        onClick={() => setCurrentScreen('groupbuys')}
                        className="btn-ghost text-sm sm:text-base flex items-center gap-1 group"
                    >
                        View more
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                </div>
                
                {featuredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                        {featuredProducts.map((product, index) => (
                            <div 
                                key={product.id} 
                                className="card-product animate-scale-in"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                {/* Product Image/Icon */}
                                <div className="h-40 sm:h-48 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-black/5"></div>
                                    <span className="text-white text-5xl sm:text-6xl relative z-10">🛒</span>
                                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                                        <span className="text-white text-xs font-semibold">{product.region}</span>
                                    </div>
                                </div>
                                
                                {/* Product Info */}
                                <div className="p-5 sm:p-6">
                                    <h3 className="font-bold text-lg sm:text-xl mb-2 text-gray-900 line-clamp-1">
                                        {product.title}
                                    </h3>
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                                        {product.description}
                                    </p>
                                    
                                    {/* Price */}
                                    <div className="flex items-baseline gap-2 mb-4">
                                        <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                                            ${product.price}
                                        </span>
                                        <span className="text-sm text-gray-500">per unit</span>
                                    </div>
                                    
                                    {/* Progress Bar */}
                                    <div className="mb-3">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                            <div 
                                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500" 
                                                style={{ width: `${Math.min((product.currentQuantity / product.targetQuantity) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    
                                    {/* Stats */}
                                    <div className="flex justify-between items-center text-sm mb-4">
                                        <span className="text-gray-600 font-medium">
                                            {product.currentQuantity}/{product.targetQuantity} committed
                                        </span>
                                        <span className="text-blue-600 font-bold">
                                            {Math.round((product.currentQuantity / product.targetQuantity) * 100)}% funded
                                        </span>
                                    </div>
                                    
                                    {/* CTA Button */}
                                    <button 
                                        onClick={() => {
                                            window.location.hash = `#groupbuy/${product.id}`;
                                        }}
                                        className="w-full btn-primary text-sm sm:text-base py-3 min-h-[48px]"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card-empty text-center">
                        <div className="text-6xl mb-4">🛒</div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            No featured group buys yet
                        </h3>
                        <p className="text-gray-500 text-sm sm:text-base">
                            Vendors can add products from the dashboard.
                        </p>
                    </div>
                )}
            </div>

            {/* Open Errands */}
            <div className="animate-slide-up">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Open Errands</h2>
                    <button
                        onClick={() => setCurrentScreen('errands')}
                        className="btn-ghost text-sm sm:text-base flex items-center gap-1 group"
                    >
                        View all
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                </div>
                
                {featuredErrands.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                        {featuredErrands.map((errand, index) => (
                            <div 
                                key={errand.id} 
                                className="card card-hover animate-scale-in"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg sm:text-xl mb-2 text-gray-900 line-clamp-2">
                                            {errand.title}
                                        </h3>
                                    </div>
                                    <div className="ml-3 text-3xl sm:text-4xl">🤝</div>
                                </div>
                                
                                <p className="text-gray-600 text-sm sm:text-base mb-4 line-clamp-3 min-h-[60px]">
                                    {errand.description}
                                </p>
                                
                                <div className="flex flex-wrap gap-3 items-center pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                        <span>📍</span>
                                        <span className="font-medium">{errand.region}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
                                        <span>💰</span>
                                        <span>${errand.budget}</span>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => {
                                        window.location.hash = `#errand/${errand.id}`;
                                    }}
                                    className="w-full mt-4 btn-secondary text-sm sm:text-base py-3 min-h-[48px]"
                                >
                                    View Details
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card-empty text-center">
                        <div className="text-6xl mb-4">🤝</div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            No errands available
                        </h3>
                        <p className="text-gray-500 text-sm sm:text-base mb-4">
                            Post one to get help fast.
                        </p>
                        <button 
                            onClick={() => setCurrentScreen('errands')}
                            className="btn-primary text-sm sm:text-base"
                        >
                            Post an Errand
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BrowsePage;
