/**
 * Group Buy Detail Page
 * Shows full product information and allows joining
 */

import React, { useState, useEffect } from 'react';
import { useProducts, useUser, useSetCurrentScreen } from '../stores';
import CheckoutModal from '../components/CheckoutModal';
import toast from 'react-hot-toast';

const GroupBuyDetailPage = () => {
    // Get productId from URL hash (e.g., #groupbuy/123)
    const [productId, setProductId] = useState(null);
    const products = useProducts();
    const user = useUser();
    const setCurrentScreen = useSetCurrentScreen();
    const [checkoutState, setCheckoutState] = useState({
        isOpen: false,
        product: null,
        quantity: 1
    });

    // Get product ID from URL hash (format: #groupbuy/123)
    useEffect(() => {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#groupbuy/')) {
            const id = hash.replace('#groupbuy/', '');
            setProductId(id);
        }
    }, []);

    // Also listen for hash changes
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash && hash.startsWith('#groupbuy/')) {
                const id = hash.replace('#groupbuy/', '');
                setProductId(id);
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const product = products.find(p => String(p.id) === String(productId));

    if (!productId || !product) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Product Not Found</h2>
                    <p className="text-gray-600 mb-4">The group buy you're looking for doesn't exist.</p>
                    <button
                        onClick={() => setCurrentScreen('groupbuys')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Back to Group Buys
                    </button>
                </div>
            </div>
        );
    }

    const progress = product.targetQuantity > 0 
        ? (product.currentQuantity / product.targetQuantity) * 100 
        : 0;
    const deadline = product.deadline ? new Date(product.deadline) : null;
    const daysLeft = deadline ? Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)) : null;
    const isExpired = daysLeft !== null && daysLeft <= 0;
    const isCompleted = progress >= 100;

    const handleJoinGroupBuy = () => {
        if (!user) {
            toast.error('Please sign in to join a group buy');
            setCurrentScreen('auth');
            return;
        }

        const quantity = 1;
        const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        setCheckoutState({
            isOpen: true,
            product,
            quantity,
            orderId
        });
    };

    const handlePaymentSuccess = async (paymentData) => {
        toast.success(`Successfully joined ${product.title}!`);
        setCheckoutState({ isOpen: false, product: null, quantity: 1 });
    };

    const handleCheckoutCancel = () => {
        setCheckoutState({ isOpen: false, product: null, quantity: 1 });
    };

    return (
        <div className="max-w-4xl mx-auto px-4 pb-24 sm:pb-8">
            {/* Mobile-optimized sticky header */}
            <div className="sticky top-0 bg-white z-10 py-3 mb-4 border-b border-gray-200 -mx-4 px-4 shadow-sm">
                <button
                    onClick={() => {
                        window.location.hash = '';
                        setCurrentScreen('groupbuys');
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center min-h-[44px] text-base"
                >
                    <span className="mr-2 text-xl">←</span>
                    <span>Back</span>
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
                {/* Product Image - Mobile optimized */}
                <div className="h-48 sm:h-64 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden">
                    {product.imageDataUrl ? (
                        <img 
                            src={product.imageDataUrl} 
                            alt={product.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="text-white text-4xl sm:text-6xl">
                            {product.imageColor ? '📦' : '🛒'}
                        </div>
                    )}
                </div>

                {/* Product Details - Mobile optimized */}
                <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-3">
                        <div className="flex-1">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                                {product.title}
                            </h1>
                            <p className="text-base sm:text-lg text-gray-600 mb-2">
                                by <span className="font-semibold">{product.vendor || 'Unknown Vendor'}</span>
                            </p>
                        </div>
                        <div className="text-left sm:text-right">
                            <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                                ${product.price}
                            </div>
                            <div className="text-sm text-gray-500">per unit</div>
                        </div>
                    </div>

                    {/* Region and Deadline */}
                    <div className="flex flex-wrap gap-4 mb-6 text-sm">
                        <div className="flex items-center text-gray-600">
                            <span className="mr-2">📍</span>
                            {product.region}
                        </div>
                        {deadline && (
                            <div className="flex items-center text-gray-600">
                                <span className="mr-2">⏰</span>
                                Deadline: {deadline.toLocaleDateString()}
                                {daysLeft !== null && (
                                    <span className={`ml-2 ${daysLeft <= 3 ? 'text-red-600 font-semibold' : ''}`}>
                                        ({daysLeft} days left)
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Progress</span>
                            <span className="text-sm text-gray-600">
                                {product.currentQuantity} / {product.targetQuantity} units
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                                className={`h-4 rounded-full transition-all ${
                                    isCompleted ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            ></div>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                            {isCompleted ? (
                                <span className="text-green-600 font-semibold">✓ Goal Reached!</span>
                            ) : isExpired ? (
                                <span className="text-red-600 font-semibold">✗ Expired</span>
                            ) : (
                                <span>{Math.round(progress)}% filled</span>
                            )}
                        </div>
                    </div>

                    {/* Description - Mobile optimized */}
                    <div className="mb-6">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Description</h2>
                        <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                            {product.description || 'No description provided.'}
                        </p>
                    </div>

                </div>
            </div>

            {/* Mobile-optimized sticky CTA button */}
            {!isExpired && !isCompleted && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 md:hidden shadow-lg">
                    <button
                        onClick={handleJoinGroupBuy}
                        className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg min-h-[56px]"
                    >
                        Join Group Buy - ${product.price}
                    </button>
                </div>
            )}

            {/* Desktop CTA (inside card) */}
            <div className="hidden md:block bg-white rounded-lg shadow-md p-6">
                {!isExpired && !isCompleted && (
                    <button
                        onClick={handleJoinGroupBuy}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg min-h-[48px]"
                    >
                        Join Group Buy - ${product.price}
                    </button>
                )}
                {isCompleted && (
                    <div className="w-full bg-green-100 text-green-800 py-3 px-6 rounded-lg text-center font-semibold">
                        ✓ Group Buy Completed!
                    </div>
                )}
                {isExpired && (
                    <div className="w-full bg-red-100 text-red-800 py-3 px-6 rounded-lg text-center font-semibold">
                        ✗ This group buy has expired
                    </div>
                )}
            </div>

            {/* Checkout Modal */}
            {checkoutState.isOpen && checkoutState.product && (
                <CheckoutModal
                    isOpen={checkoutState.isOpen}
                    onClose={handleCheckoutCancel}
                    amount={checkoutState.product.price * checkoutState.quantity}
                    currency="cad"
                    orderId={checkoutState.orderId}
                    productId={checkoutState.product.id}
                    productName={checkoutState.product.title}
                    onSuccess={handlePaymentSuccess}
                    metadata={{
                        quantity: checkoutState.quantity,
                        productTitle: checkoutState.product.title
                    }}
                />
            )}
        </div>
    );
};

export default GroupBuyDetailPage;

