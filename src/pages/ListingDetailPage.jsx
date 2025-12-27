/**
 * Listing Detail Page
 * Shows full listing information with region selector and allows placing orders
 * Replaces GroupBuyDetailPage with new regional marketplace model
 */

import React, { useState, useEffect } from 'react';
import { useListings, useGetBatchesByListing, useUser, useSetCurrentScreen, useAddOrder, useAuthStore } from '../stores';
import RegionSelector from '../components/RegionSelector';
import CheckoutModal from '../components/CheckoutModal';
import ChatModal from '../components/ChatModal';
import MobileHeader from '../components/mobile/MobileHeader';
import { MessageCircle, Share2, MapPin, Package, AlertCircle } from 'lucide-react';
import { canJoinBatch } from '../services/supabaseService';
import ReportButton from '../components/ReportButton';
import { checkListingSuspension } from '../services/moderationService';
import toast from 'react-hot-toast';
import { getUserDisplayName } from '../utils/authUtils';

const ListingDetailPage = () => {
    // Get listingId from URL hash (e.g., #listing/123)
    const [listingId, setListingId] = useState(null);
    const listings = useListings();
    const getBatchesByListing = useGetBatchesByListing();
    const user = useUser();
    const loginMethod = useAuthStore((state) => state.loginMethod);
    const displayName = getUserDisplayName(user, loginMethod);
    const setCurrentScreen = useSetCurrentScreen();
    const addOrder = useAddOrder();
    
    const [selectedBatchId, setSelectedBatchId] = useState(null);
    const [checkoutState, setCheckoutState] = useState({
        isOpen: false,
        listing: null,
        batch: null,
        quantity: 1
    });
    const [chatOpen, setChatOpen] = useState(false);
    const [isSuspended, setIsSuspended] = useState(false);
    const [suspension, setSuspension] = useState(null);

    // Get listing ID from URL hash (format: #listing/123)
    useEffect(() => {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#listing/')) {
            const id = hash.replace('#listing/', '');
            setListingId(id);
        }
    }, []);

    // Also listen for hash changes
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash && hash.startsWith('#listing/')) {
                const id = hash.replace('#listing/', '');
                setListingId(id);
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Check if listing is suspended
    useEffect(() => {
        if (listingId && listing) {
            const checkSuspension = async () => {
                try {
                    const result = await checkListingSuspension(parseInt(listingId));
                    if (result.success) {
                        setIsSuspended(result.isSuspended);
                        setSuspension(result.suspension);
                    }
                } catch (error) {
                    console.error('Error checking listing suspension:', error);
                }
            };
            checkSuspension();
        }
    }, [listingId, listing]);

    const listing = listings.find(l => String(l.id) === String(listingId));
    const batches = listing ? getBatchesByListing(listing.id) || [] : [];
    // Filter to only show active batches that can accept orders
    const activeBatches = batches.filter(b => canJoinBatch(b));
    
    // Set default selected batch
    useEffect(() => {
        if (batches.length > 0 && !selectedBatchId) {
            setSelectedBatchId(batches[0].id);
        }
    }, [batches, selectedBatchId]);
    
    const selectedBatch = batches.find(b => b.id === selectedBatchId);

    if (!listingId || !listing) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Listing Not Found</h2>
                    <p className="text-gray-600 mb-4">The listing you're looking for doesn't exist.</p>
                    <button
                        onClick={() => setCurrentScreen('groupbuys')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Back to Marketplace
                    </button>
                </div>
            </div>
        );
    }

    const handleJoinListing = async () => {
        if (!user) {
            toast.error('Please sign in to place an order');
            setCurrentScreen('auth');
            return;
        }

        // RBAC check: Only CUSTOMER can join group buys (action level)
        const { checkPermission } = await import('../utils/rbacUtils');
        const permissionCheck = checkPermission(user, loginMethod, 'customer');
        if (!permissionCheck.allowed) {
            toast.error(permissionCheck.error);
            return;
        }

        if (!selectedBatch) {
            toast.error('Please select a region');
            return;
        }

        // Validate batch can accept orders
        if (!canJoinBatch(selectedBatch)) {
            if (selectedBatch.status !== 'active') {
                toast.error('This batch is not active and cannot accept orders');
            } else {
                toast.error('This batch has passed its deadline and is no longer accepting orders');
            }
            return;
        }

        const quantity = 1;
        const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        setCheckoutState({
            isOpen: true,
            listing,
            batch: selectedBatch,
            quantity,
            orderId
        });
    };

    const handlePaymentSuccess = async (paymentData) => {
        try {
            // RBAC check: Only CUSTOMER can create orders (action level - additional security)
            const { checkPermission } = await import('../utils/rbacUtils');
            const permissionCheck = checkPermission(user, loginMethod, 'customer');
            if (!permissionCheck.allowed) {
                toast.error(permissionCheck.error);
                return;
            }

            // Import escrow service
            const { placeOrderInEscrow } = await import('../services/escrowService');
            
            // Create order with escrow status
            const order = {
                id: checkoutState.orderId,
                listingId: listing.id,
                regionalBatchId: selectedBatch.id,
                customerEmail: user.email || user.id,
                customerName: displayName || user.email || user.id,
                quantity: checkoutState.quantity,
                totalPrice: selectedBatch.price * checkoutState.quantity,
                total: selectedBatch.price * checkoutState.quantity,
                groupStatus: 'open',
                fulfillmentStatus: 'pending',
                paymentStatus: 'authorized', // Authorized but held in escrow
                escrowStatus: 'escrow_held', // Funds in escrow
                paymentIntentId: paymentData?.paymentIntentId || null,
                createdAt: new Date().toISOString()
            };
            
            // Place order in escrow
            const escrowResult = await placeOrderInEscrow(
                order.id,
                paymentData?.paymentIntentId,
                order.totalPrice
            );
            
            if (!escrowResult.success) {
                throw new Error(escrowResult.error || 'Failed to place order in escrow');
            }
            
            // Update order with escrow status
            order.escrowStatus = escrowResult.escrowStatus || 'escrow_held';
            
            addOrder(order);
            
            // Notify customer they joined the group buy
            const { useAppStore } = await import('../stores');
            const { createNotification } = await import('../services/notificationService');
            const customerEmail = user.email || user.id;
            if (customerEmail) {
                await createNotification(
                    customerEmail,
                    'success',
                    `You joined "${listing.title}" in ${selectedBatch.region}. Waiting for group buy to reach target.`,
                    'Group Buy Joined',
                    { type: 'group_buy_joined', listingId: listing.id, batchId: selectedBatch.id, orderId: order.id }
                );
            }
            
            // Notify vendor about new order
            const appStore = useAppStore.getState();
            if (listing.ownerEmail && listing.ownerEmail !== customerEmail) {
                await createNotification(
                    listing.ownerEmail,
                    'success',
                    `${displayName || user.email} joined "${listing.title}" in ${selectedBatch.region}`,
                    'New Order Received',
                    { type: 'order_received', listingId: listing.id, batchId: selectedBatch.id, orderId: order.id }
                );
            }
            
            toast.success(`Order placed! Funds held in escrow until group buy succeeds.`);
            setCheckoutState({ isOpen: false, listing: null, batch: null, quantity: 1 });
        } catch (error) {
            toast.error('Failed to create order: ' + error.message);
        }
    };

    const handleShare = () => {
        const url = `${window.location.origin}${window.location.pathname}#listing/${listing.id}`;
        if (navigator.share) {
            navigator.share({
                title: listing.title,
                text: `Check out ${listing.title} on the marketplace!`,
                url: url
            }).catch(() => {
                // Fallback to clipboard
                navigator.clipboard.writeText(url);
                toast.success('Link copied to clipboard!');
            });
        } else {
            navigator.clipboard.writeText(url);
            toast.success('Link copied to clipboard!');
        }
    };

    return (
        <>
            <MobileHeader title={listing.title} />
            <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Header Image/Color */}
                    {listing.imageDataUrl ? (
                        <img 
                            src={listing.imageDataUrl} 
                            alt={listing.title}
                            className="w-full h-64 object-cover"
                        />
                    ) : listing.imageColor ? (
                        <div 
                            className="w-full h-64"
                            style={{ backgroundColor: listing.imageColor }}
                        />
                    ) : null}

                    <div className="p-6">
                        {/* Title and Actions */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                                    {listing.title}
                                </h1>
                                {listing.vendor && (
                                    <p className="text-gray-600 text-sm mb-2">by {listing.vendor}</p>
                                )}
                                {listing.originLocation && (
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                        <MapPin size={14} />
                                        <span>From: {listing.originLocation}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleShare}
                                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    aria-label="Share listing"
                                >
                                    <Share2 size={20} />
                                </button>
                                <button
                                    onClick={() => setChatOpen(true)}
                                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    aria-label="Open chat"
                                >
                                    <MessageCircle size={20} />
                                </button>
                                <ReportButton
                                    reportType="listing"
                                    targetId={listing.id}
                                    targetTitle={listing.title}
                                />
                            </div>
                        </div>

                        {/* Description */}
                        {listing.description && (
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                                <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
                            </div>
                        )}

                        {/* Region Selector */}
                        <div className="mb-6">
                            <RegionSelector
                                batches={activeBatches}
                                selectedBatchId={selectedBatchId}
                                onSelectBatch={setSelectedBatchId}
                                listing={listing}
                            />
                        </div>

                        {/* Selected Batch Details */}
                        {selectedBatch && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-gray-900">
                                        {selectedBatch.region} - ${selectedBatch.price.toFixed(2)}
                                    </h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        selectedBatch.status === 'active' 
                                            ? 'bg-blue-100 text-blue-800'
                                            : selectedBatch.status === 'successful'
                                            ? 'bg-green-100 text-green-800'
                                            : selectedBatch.status === 'failed'
                                            ? 'bg-red-100 text-red-800'
                                            : selectedBatch.status === 'draft'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {selectedBatch.status === 'active' ? 'Active' : 
                                         selectedBatch.status === 'successful' ? 'Successful' :
                                         selectedBatch.status === 'failed' ? 'Failed' :
                                         selectedBatch.status === 'draft' ? 'Draft' :
                                         selectedBatch.status}
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                    <div>
                                        <span className="text-gray-600">Delivery:</span>
                                        <span className="ml-2 font-medium text-gray-900 flex items-center gap-1">
                                            <Package size={14} />
                                            {selectedBatch.deliveryMethod === 'pickup_point' 
                                                ? 'Pickup Point' 
                                                : 'Direct Delivery'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Minimum:</span>
                                        <span className="ml-2 font-medium text-gray-900">
                                            {selectedBatch.minimumQuantity} units
                                        </span>
                                    </div>
                                </div>

                                {/* Join Button */}
                                {canJoinBatch(selectedBatch) && (
                                    <button
                                        onClick={handleJoinListing}
                                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-semibold text-lg"
                                    >
                                        Place Order - ${selectedBatch.price.toFixed(2)}
                                    </button>
                                )}
                                {!canJoinBatch(selectedBatch) && selectedBatch.status === 'active' && (
                                    <div className="w-full bg-yellow-50 border border-yellow-200 rounded-md p-3 text-center">
                                        <p className="text-yellow-800 text-sm font-medium">
                                            Deadline has passed. This batch is no longer accepting orders.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* All Available Regions Summary */}
                        {batches.length > 1 && (
                            <div className="border-t border-gray-200 pt-4">
                                <h3 className="font-semibold text-gray-900 mb-2">Available Regions</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {batches.map(batch => (
                                        <div 
                                            key={batch.id}
                                            className={`p-2 rounded-md text-sm ${
                                                batch.id === selectedBatchId
                                                    ? 'bg-blue-100 border-2 border-blue-500'
                                                    : 'bg-gray-50 border border-gray-200'
                                            }`}
                                        >
                                            <div className="font-medium text-gray-900">{batch.region}</div>
                                            <div className="text-blue-600 font-semibold">${batch.price.toFixed(2)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Checkout Modal */}
            {checkoutState.isOpen && checkoutState.batch && (
                <CheckoutModal
                    isOpen={checkoutState.isOpen}
                    onClose={() => setCheckoutState({ isOpen: false, listing: null, batch: null, quantity: 1 })}
                    product={{
                        id: listing.id,
                        title: listing.title,
                        price: checkoutState.batch.price,
                        region: checkoutState.batch.region
                    }}
                    quantity={checkoutState.quantity}
                    orderId={checkoutState.orderId}
                    onPaymentSuccess={handlePaymentSuccess}
                />
            )}

            {/* Chat Modal */}
            {chatOpen && (
                <ChatModal
                    isOpen={chatOpen}
                    onClose={() => setChatOpen(false)}
                    chatType="group_buy"
                    productId={listing.id}
                    productTitle={listing.title}
                />
            )}
        </>
    );
};

export default ListingDetailPage;

