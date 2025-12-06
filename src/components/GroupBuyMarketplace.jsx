import React, { useMemo } from 'react';
import { useAppStore } from '../stores';
import { useUpdateGroupBuyFilters, useUser } from '../stores';
import toast from 'react-hot-toast';

/**
 * GroupBuyMarketplace Component
 * 
 * A reusable component that handles filtering, sorting, and displaying group buy products.
 * Extracted from GroupBuysPage to improve modularity and reusability.
 */
const GroupBuyMarketplace = ({ 
    products = [], 
    orders = [], 
    onJoinGroupBuy,
    filters = {},
    onFilterChange 
}) => {
    const user = useUser();
    const updateGroupBuyFilters = useUpdateGroupBuyFilters();
    
    // Get filter values
    const search = filters.search || '';
    const region = filters.region || 'all';
    const category = filters.category || 'all';
    const priceRange = filters.priceRange || 'all';
    const status = filters.status || 'all';
    const sort = filters.sort || 'popularity';
    
    // Memoize filtered and sorted products
    const filteredProducts = useMemo(() => {
        if (!Array.isArray(products)) return [];
        
        const filtered = products.filter(product => {
            if (!product) return false;
            
            // Search filter
            if (search) {
                const searchLower = search.toLowerCase();
                const matchesSearch = 
                    (product.title || '').toLowerCase().includes(searchLower) ||
                    (product.description || '').toLowerCase().includes(searchLower) ||
                    (product.vendor || '').toLowerCase().includes(searchLower);
                if (!matchesSearch) return false;
            }
            
            // Region filter
            if (region && region !== 'all' && product.region !== region) {
                return false;
            }
            
            // Category filter
            if (category && category !== 'all' && product.category !== category) {
                return false;
            }
            
            // Price range filter
            if (priceRange && priceRange !== 'all') {
                const price = product.price || 0;
                switch (priceRange) {
                    case 'under-25':
                        if (price >= 25) return false;
                        break;
                    case '25-50':
                        if (price < 25 || price > 50) return false;
                        break;
                    case '50-100':
                        if (price < 50 || price > 100) return false;
                        break;
                    case '100-200':
                        if (price < 100 || price > 200) return false;
                        break;
                    case 'over-200':
                        if (price <= 200) return false;
                        break;
                }
            }
            
            // Status filter
            if (status && status !== 'all') {
                const currentQuantity = product.currentQuantity || 0;
                const targetQuantity = product.targetQuantity || 1;
                const progress = targetQuantity > 0 ? (currentQuantity / targetQuantity) * 100 : 0;
                const deadline = product.deadline ? new Date(product.deadline) : null;
                const daysLeft = deadline ? Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)) : null;
                
                switch (status) {
                    case 'open':
                        if (progress >= 100 || (daysLeft !== null && daysLeft <= 0)) return false;
                        break;
                    case 'closing-soon':
                        if (daysLeft === null || daysLeft > 3 || daysLeft <= 0) return false;
                        break;
                    case 'almost-full':
                        if (progress < 80 || progress >= 100) return false;
                        break;
                    case 'new':
                        const createdDate = product.createdAt ? new Date(product.createdAt) : null;
                        if (!createdDate) return false;
                        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                        if (createdDate < weekAgo) return false;
                        break;
                }
            }
            
            return true;
        });
        
        // Apply sorting
        return filtered.sort((a, b) => {
            switch (sort) {
                case 'popularity':
                    const aOrders = orders.filter(o => o && o.productId === a.id).length;
                    const bOrders = orders.filter(o => o && o.productId === b.id).length;
                    return bOrders - aOrders;
                case 'deadline':
                    const aDeadline = a.deadline ? new Date(a.deadline) : new Date(0);
                    const bDeadline = b.deadline ? new Date(b.deadline) : new Date(0);
                    return aDeadline - bDeadline;
                case 'price-low':
                    return (a.price || 0) - (b.price || 0);
                case 'price-high':
                    return (b.price || 0) - (a.price || 0);
                case 'progress':
                    const aCurrentQty = a.currentQuantity || 0;
                    const aTargetQty = a.targetQuantity || 1;
                    const bCurrentQty = b.currentQuantity || 0;
                    const bTargetQty = b.targetQuantity || 1;
                    const aProgress = aTargetQty > 0 ? (aCurrentQty / aTargetQty) * 100 : 0;
                    const bProgress = bTargetQty > 0 ? (bCurrentQty / bTargetQty) * 100 : 0;
                    return bProgress - aProgress;
                case 'newest':
                    const aCreated = a.createdAt ? new Date(a.createdAt) : new Date(0);
                    const bCreated = b.createdAt ? new Date(b.createdAt) : new Date(0);
                    return bCreated - aCreated;
                default:
                    return 0;
            }
        });
    }, [products, orders, search, region, category, priceRange, status, sort]);
    
    const handleFilterChange = (newFilters) => {
        if (onFilterChange) {
            onFilterChange(newFilters);
        } else {
            updateGroupBuyFilters(newFilters);
        }
    };
    
    const handleJoinClick = (product) => {
        if (!user) {
            toast.error('Please sign in to join a group buy');
            return;
        }
        if (onJoinGroupBuy) {
            onJoinGroupBuy(product);
        }
    };
    
    return (
        <>
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search products, brands, or descriptions..."
                            value={search}
                            onChange={(e) => handleFilterChange({ search: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            data-testid="groupbuy-search-input"
                        />
                    </div>
                    <select 
                        value={category}
                        onChange={(e) => handleFilterChange({ category: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        data-testid="groupbuy-category-filter"
                    >
                        <option value="all">All Categories</option>
                        <option value="food">🍜 Food & Beverages</option>
                        <option value="household">🏠 Household Items</option>
                        <option value="beauty">💄 Beauty & Personal Care</option>
                    </select>
                    <select 
                        value={region}
                        onChange={(e) => handleFilterChange({ region: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        data-testid="groupbuy-region-filter"
                    >
                        <option value="all">All Regions</option>
                        <option value="Toronto">Toronto</option>
                        <option value="Hamilton">Hamilton</option>
                        <option value="Niagara">Niagara</option>
                    </select>
                    <select 
                        value={priceRange}
                        onChange={(e) => handleFilterChange({ priceRange: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        data-testid="groupbuy-price-filter"
                    >
                        <option value="all">All Prices</option>
                        <option value="under-25">Under $25</option>
                        <option value="25-50">$25-$50</option>
                        <option value="50-100">$50-$100</option>
                        <option value="100-200">$100-$200</option>
                        <option value="over-200">Over $200</option>
                    </select>
                </div>
            </div>

            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
                <span className="text-gray-600" data-testid="product-count">
                    {filteredProducts.length} products available
                </span>
                <select 
                    value={sort}
                    onChange={(e) => handleFilterChange({ sort: e.target.value })}
                    className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-testid="groupbuy-sort-filter"
                >
                    <option value="popularity">🔥 Popularity</option>
                    <option value="deadline">⏰ Deadline</option>
                    <option value="price-low">💰 Price: Low to High</option>
                    <option value="price-high">💰 Price: High to Low</option>
                    <option value="progress">📊 Progress</option>
                    <option value="newest">✨ Newest</option>
                </select>
            </div>

            {/* Products Grid - Mobile optimized, stacked on mobile */}
            {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6" data-testid="products-grid">
                    {filteredProducts.filter(p => p && p.id).map((product, index) => (
                        <div 
                            key={product.id} 
                            className="card-product animate-scale-in"
                            style={{ animationDelay: `${index * 0.05}s` }}
                            data-testid={`product-card-${product.id}`}
                        >
                            {/* Product Image */}
                            <div className="h-40 sm:h-48 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-black/5"></div>
                                <span className="text-white text-5xl sm:text-6xl relative z-10">🛒</span>
                                <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                                    <span className="text-white text-xs font-bold">{product.region || 'Unknown'}</span>
                                </div>
                            </div>
                            
                            {/* Product Info */}
                            <div className="p-5 sm:p-6">
                                <h3 className="font-bold text-lg sm:text-xl mb-2 text-gray-900 line-clamp-1">
                                    {product.title || 'Untitled Product'}
                                </h3>
                                <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                                    {product.description || ''}
                                </p>
                                
                                {/* Price */}
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                                        ${product.price || 0}
                                    </span>
                                    <span className="text-sm text-gray-500">per unit</span>
                                </div>
                                
                                {/* Progress Bar */}
                                <div className="mb-3">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                        <div 
                                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500" 
                                            style={{ width: `${Math.min(((product.currentQuantity || 0) / (product.targetQuantity || 1)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                
                                {/* Stats */}
                                <div className="flex justify-between items-center text-sm mb-4">
                                    <span className="text-gray-600 font-medium">
                                        {product.currentQuantity || 0}/{product.targetQuantity || 0} committed
                                    </span>
                                    <span className="text-blue-600 font-bold">
                                        {Math.round(((product.currentQuantity || 0) / (product.targetQuantity || 1)) * 100)}% funded
                                    </span>
                                </div>
                                
                                {/* Action Buttons - Mobile optimized */}
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <button 
                                        onClick={() => {
                                            // Navigate to detail page using hash routing
                                            window.location.hash = `groupbuy/${product.id}`;
                                            // Trigger hashchange event for App.jsx to detect
                                            window.dispatchEvent(new HashChangeEvent('hashchange'));
                                        }}
                                        className="flex-1 btn-secondary text-sm sm:text-base py-3 min-h-[48px]"
                                        data-testid={`view-details-${product.id}`}
                                    >
                                        View Details
                                    </button>
                                    <button 
                                        onClick={() => handleJoinClick(product)}
                                        className="flex-1 btn-primary text-sm sm:text-base py-3 min-h-[48px]"
                                        data-testid={`join-button-${product.id}`}
                                        data-coach-target="join-groupbuy-button"
                                    >
                                        Join Group Buy
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card-empty text-center animate-fade-in" data-testid="empty-state">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        No group buys match your filters
                    </h3>
                    <p className="text-gray-500 text-sm sm:text-base">
                        Try adjusting your search criteria.
                    </p>
                </div>
            )}
        </>
    );
};

export default GroupBuyMarketplace;

