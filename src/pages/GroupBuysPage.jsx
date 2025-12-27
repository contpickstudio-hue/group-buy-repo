import React, { useState, useEffect } from 'react';
import { useAppStore } from '../stores';
import { useUpdateProduct, useAddOrder, useUpdatePaymentStatus, useUser, useOrders, useProcessReferralOrder } from '../stores';
import CheckoutModal from '../components/CheckoutModal';
import GroupBuyMarketplace from '../components/GroupBuyMarketplace';
import toast from 'react-hot-toast';

const GroupBuysPage = () => {
    try {
        // Get raw data from store
        const products = useAppStore((state) => state.products || []);
        const filters = useAppStore((state) => state.filters?.groupbuys || {});
        
        const updateProduct = useUpdateProduct();
        const addOrder = useAddOrder();
        const updatePaymentStatus = useUpdatePaymentStatus();
        const user = useUser();
        const orders = useOrders();
        const processReferralOrder = useProcessReferralOrder();
        const applyCredits = useApplyCredits();
    
    const [checkoutState, setCheckoutState] = useState({
        isOpen: false,
        product: null,
        quantity: 1,
        orderId: null
    });

    const handleJoinGroupBuy = async (product) => {
        if (!user) {
            toast.error('Please sign in to join a group buy');
            return;
        }

        const quantity = 1; // Default quantity, can be made configurable
        const totalAmount = (product.price || 0) * quantity;
        
        // Create a temporary order ID
        const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Open checkout modal
        setCheckoutState({
            isOpen: true,
            product,
            quantity,
            orderId
        });
    };

    const handlePaymentSuccess = async (paymentData) => {
        const { product, quantity, orderId } = checkoutState;
        
        try {
            // Create the order with payment information
            const creditsApplied = paymentData.creditsApplied || 0;
            const order = {
                id: orderId,
                productId: product.id,
                customerEmail: user.email,
                customerName: user.name,
                quantity,
                totalPrice: paymentData.finalAmount !== undefined ? paymentData.finalAmount : (product.price * quantity - creditsApplied),
                total: paymentData.finalAmount !== undefined ? paymentData.finalAmount : (product.price * quantity - creditsApplied),
                groupStatus: 'open',
                fulfillmentStatus: 'pending',
                paymentStatus: paymentData.escrow ? 'held' : 'paid',
                paymentIntentId: paymentData.paymentIntentId,
                paymentDate: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                creditsApplied: creditsApplied,
                referralCode: null // Will be set if referral was used
            };
            
            // Apply credits if any were used
            if (creditsApplied > 0) {
                try {
                    await applyCredits(orderId, creditsApplied);
                } catch (creditsError) {
                    console.error('Failed to apply credits:', creditsError);
                    // Don't block order creation if credits fail
                }
            }

            // Check if this is user's first order (for referral processing)
            const userOrders = orders.filter(o => o.customerEmail === user.email);
            const isFirstOrder = userOrders.length === 0;
            
            // Process referral if this is the first order
            if (isFirstOrder) {
                try {
                    await processReferralOrder(user.email, orderId);
                    toast.success('🎉 Referral bonus applied! Credits added to your account.');
                } catch (refError) {
                    console.error('Failed to process referral:', refError);
                    // Don't block order creation if referral fails
                }
            }
            
            // Add order to store
            addOrder(order);
            
            // Update payment status
            await updatePaymentStatus(orderId, {
                status: paymentData.escrow ? 'held' : 'paid',
                paymentIntentId: paymentData.paymentIntentId
            });

            // Update product quantity
            const currentProduct = products.find(p => p.id === product.id);
            if (currentProduct) {
                updateProduct(product.id, {
                    currentQuantity: (currentProduct.currentQuantity || 0) + quantity
                });
            }

            toast.success(`Successfully joined ${product.title}! Payment ${paymentData.escrow ? 'authorized' : 'completed'}.`);
            
            // Close checkout modal
            setCheckoutState({
                isOpen: false,
                product: null,
                quantity: 1,
                orderId: null
            });
        } catch (error) {
            toast.error(`Failed to complete order: ${error.message}`);
        }
    };

    const handleCheckoutCancel = () => {
        setCheckoutState({
            isOpen: false,
            product: null,
            quantity: 1,
            orderId: null
        });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Header - Mobile optimized */}
            <div className="text-center mb-6 sm:mb-8 animate-fade-in">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-3">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse-slow"></span>
                    Community bulk orders
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
                    Group Buy Marketplace
                </h1>
                <p className="text-gray-600 text-base sm:text-lg">
                    Find deals by category, price, and popularity
                </p>
            </div>

            {/* Group Buy Marketplace Component */}
            <GroupBuyMarketplace
                products={products}
                orders={orders}
                filters={filters}
                onJoinGroupBuy={handleJoinGroupBuy}
            />

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
    } catch (error) {
        console.error('GroupBuysPage error:', error);
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                        Unable to Load Group Buys
                    </h3>
                    <p className="text-red-600 mb-4">
                        There was an error loading group buys. Please try refreshing the page.
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

export default GroupBuysPage;
