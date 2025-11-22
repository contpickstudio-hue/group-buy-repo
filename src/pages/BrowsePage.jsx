import React from 'react';
import { useProducts, useErrands, useSetCurrentScreen } from '../stores';

const BrowsePage = () => {
    const products = useProducts();
    const errands = useErrands();
    const setCurrentScreen = useSetCurrentScreen();

    const featuredProducts = products.slice(0, 3);
    const featuredErrands = errands.slice(0, 3);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Hero Section */}
            <div className="text-center mb-12">
                <p className="text-gray-600 mb-2">Live marketplace</p>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Browse group buys & errands
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Discover what the community is organizing right now.
                </p>
            </div>

            {/* Featured Group Buys */}
            <div className="mb-12">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-semibold text-gray-900">Featured Group Buys</h3>
                    <button
                        onClick={() => setCurrentScreen('groupbuys')}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        View more group buys →
                    </button>
                </div>
                
                {featuredProducts.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {featuredProducts.map(product => (
                            <div key={product.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                                <div className="h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg mb-4 flex items-center justify-center">
                                    <span className="text-white text-2xl">🛒</span>
                                </div>
                                <h4 className="font-semibold text-lg mb-2">{product.title}</h4>
                                <p className="text-gray-600 text-sm mb-3">{product.description}</p>
                                <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                                    <span>{product.region}</span>
                                    <span>${product.price}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full" 
                                        style={{ width: `${Math.min((product.currentQuantity / product.targetQuantity) * 100, 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm text-gray-600">
                                    {product.currentQuantity}/{product.targetQuantity} committed • 
                                    {Math.round((product.currentQuantity / product.targetQuantity) * 100)}% funded
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-8">
                        No featured group buys yet. Vendors can add products from the dashboard.
                    </p>
                )}
            </div>

            {/* Open Errands */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-semibold text-gray-900">Open Errands</h3>
                    <button
                        onClick={() => setCurrentScreen('errands')}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        View all errands →
                    </button>
                </div>
                
                {featuredErrands.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {featuredErrands.map(errand => (
                            <div key={errand.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <h4 className="font-semibold text-lg">{errand.title}</h4>
                                    <span className="text-2xl">🤝</span>
                                </div>
                                <p className="text-gray-600 text-sm mb-4">{errand.description}</p>
                                <div className="flex justify-between items-center text-sm text-gray-500">
                                    <span>{errand.region}</span>
                                    <span>${errand.budget}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-8">
                        No errands available - post one to get help fast.
                    </p>
                )}
            </div>
        </div>
    );
};

export default BrowsePage;
