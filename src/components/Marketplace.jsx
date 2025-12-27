import React, { useMemo } from 'react';
import { MapPin, Clock } from 'lucide-react';
import { useListings, useGetBatchesByListing } from '../stores';

/**
 * Marketplace Component
 * Displays listings with their available regions and nearest cutoff dates
 * Replaces GroupBuyMarketplace with new regional marketplace model
 */
const Marketplace = ({ filters = {}, onJoinListing, user }) => {
    const listings = useListings();
    const getBatchesByListing = useGetBatchesByListing();
    
    // Get all batches for all listings
    const listingsWithBatches = useMemo(() => {
        return listings.map(listing => {
            const batches = getBatchesByListing(listing.id) || [];
            const regions = batches.map(b => b.region);
            const activeBatches = batches.filter(b => b.status === 'collecting');
            
            // Find nearest cutoff date
            let nearestCutoff = null;
            if (activeBatches.length > 0) {
                const cutoffDates = activeBatches
                    .map(b => b.cutoffDate ? new Date(b.cutoffDate) : null)
                    .filter(d => d !== null && d > new Date())
                    .sort((a, b) => a - b);
                nearestCutoff = cutoffDates.length > 0 ? cutoffDates[0] : null;
            }
            
            return {
                ...listing,
                batches,
                regions,
                activeBatches,
                nearestCutoff
            };
        });
    }, [listings, getBatchesByListing]);
    
    // Apply filters
    const filteredListings = useMemo(() => {
        let filtered = listingsWithBatches;
        
        // Filter by region
        if (filters.region && filters.region !== 'all') {
            filtered = filtered.filter(listing => 
                listing.regions.includes(filters.region)
            );
        }
        
        // Filter by search
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(listing =>
                listing.title.toLowerCase().includes(searchLower) ||
                listing.description?.toLowerCase().includes(searchLower)
            );
        }
        
        // Filter by vendor
        if (filters.vendor && filters.vendor !== 'all') {
            filtered = filtered.filter(listing =>
                listing.vendor === filters.vendor
            );
        }
        
        return filtered;
    }, [listingsWithBatches, filters]);
    
    const formatTimeRemaining = (date) => {
        if (!date) return null;
        const now = new Date();
        const diff = date - now;
        if (diff <= 0) return 'Expired';
        
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days === 1) return '1 day left';
        if (days < 7) return `${days} days left`;
        if (days < 30) return `${Math.ceil(days / 7)} weeks left`;
        return `${Math.ceil(days / 30)} months left`;
    };
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings && filteredListings.length > 0 ? (
                filteredListings.map((listing) => (
                    <div key={listing.id} className="card card-product">
                        <div className="p-4">
                            <h3 className="font-bold text-lg mb-2">{listing.title}</h3>
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                {listing.description || 'No description'}
                            </p>
                            
                            {/* Available Regions */}
                            {listing.regions.length > 0 && (
                                <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                                    <MapPin size={14} />
                                    <span>Available in: {listing.regions.join(', ')}</span>
                                </div>
                            )}
                            
                            {/* Price Range */}
                            {listing.batches.length > 0 && (
                                <div className="mb-3">
                                    <span className="text-sm text-gray-600">Price: </span>
                                    {listing.batches.length === 1 ? (
                                        <span className="text-lg font-bold text-blue-600">
                                            ${listing.batches[0].price.toFixed(2)}
                                        </span>
                                    ) : (
                                        <span className="text-lg font-bold text-blue-600">
                                            ${Math.min(...listing.batches.map(b => b.price)).toFixed(2)} - ${Math.max(...listing.batches.map(b => b.price)).toFixed(2)}
                                        </span>
                                    )}
                                </div>
                            )}
                            
                            {/* Nearest Cutoff */}
                            {listing.nearestCutoff && (
                                <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
                                    <Clock size={14} />
                                    <span>{formatTimeRemaining(listing.nearestCutoff)}</span>
                                </div>
                            )}
                            
                            {/* Origin Location */}
                            {listing.originLocation && (
                                <div className="text-xs text-gray-500 mb-4">
                                    From: {listing.originLocation}
                                </div>
                            )}
                            
                            <div className="flex items-center justify-between">
                                {listing.batches.length > 0 && (
                                    <div className="text-sm text-gray-600">
                                        {listing.activeBatches.length} active batch{listing.activeBatches.length !== 1 ? 'es' : ''}
                                    </div>
                                )}
                                {user && (
                                    <button
                                        onClick={() => onJoinListing(listing)}
                                        className="btn-primary px-4 py-2 text-sm"
                                    >
                                        View Details
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-gray-600 col-span-full text-center py-8">
                    {listings.length === 0 ? 'No listings available' : 'No listings match your filters'}
                </p>
            )}
        </div>
    );
};

export default Marketplace;

