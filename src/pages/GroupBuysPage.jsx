import React, { useState, useEffect } from 'react';
import { useAppStore } from '../stores';
import { useListings, useLoadListings, useGetBatchesByListing, useLoadBatchesForListing, useAddOrder, useUpdatePaymentStatus, useUser, useOrders, useProcessReferralOrder, useApplyCredits, useSetCurrentScreen } from '../stores';
import CheckoutModal from '../components/CheckoutModal';
import Marketplace from '../components/Marketplace';
import toast from 'react-hot-toast';

const GroupBuysPage = () => {
    // Get raw data from store - hooks must be at top level
    const listings = useListings();
    const filters = useAppStore((state) => state.filters?.groupbuys || {});
    
    const loadListings = useLoadListings();
    const getBatchesByListing = useGetBatchesByListing();
    const loadBatchesForListing = useLoadBatchesForListing();
    const addOrder = useAddOrder();
    const updatePaymentStatus = useUpdatePaymentStatus();
    const user = useUser();
    const orders = useOrders();
    const setCurrentScreen = useSetCurrentScreen();
    const processReferralOrder = useProcessReferralOrder();
    const applyCredits = useApplyCredits();
    
    // Load listings and batches on mount
    useEffect(() => {
        loadListings().then((result) => {
            if (result.success && result.listings) {
                // Load batches for all listings
                result.listings.forEach(listing => {
                    loadBatchesForListing(listing.id);
                });
            }
        }).catch((error) => {
            console.error('Error loading listings:', error);
            toast.error('Failed to load listings. Please try again.');
        });
    }, [loadListings, loadBatchesForListing]);

    // Checkout state removed - handled in ListingDetailPage

    const handleJoinListing = async (listing) => {
        if (!user) {
            toast.error('Please sign in to place an order');
            setCurrentScreen('auth');
            return;
        }

        // Navigate to listing detail page where user can select region
        window.location.hash = `#listing/${listing.id}`;
        setCurrentScreen('listingdetail');
    };

    // Payment handling moved to ListingDetailPage

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Header - Mobile optimized */}
            <div className="text-center mb-6 sm:mb-8 animate-fade-in">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-3">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse-slow"></span>
                    Community bulk orders
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
                    Regional Marketplace
                </h1>
                <p className="text-gray-600 text-base sm:text-lg">
                    Find bulk deals by region, price, and delivery method
                </p>
            </div>

            {/* Marketplace Component */}
            <Marketplace
                listings={listings}
                filters={filters}
                onJoinListing={handleJoinListing}
                user={user}
            />
        </div>
    );
};

export default GroupBuysPage;
