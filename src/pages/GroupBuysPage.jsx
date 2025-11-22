import React, { useState, useMemo } from 'react';
import { useAppStore } from '../stores';
import { useFilters, useUpdateGroupBuyFilters, useJoinGroupBuy, useUpdateProduct, useAddOrder, useUpdatePaymentStatus, useUser } from '../stores';
import CheckoutModal from '../components/CheckoutModal';
import toast from 'react-hot-toast';

const GroupBuysPage = () => {
    // Get raw data from store - use individual selectors for stability
    const rawProducts = useAppStore((state) => state.products || []);
    const orders = useAppStore((state) => state.orders || []);
    
    // Get individual filter values to avoid object reference issues
    const search = useAppStore((state) => state.filters?.groupbuys?.search || '');
    const region = useAppStore((state) => state.filters?.groupbuys?.region || 'all');
    const category = useAppStore((state) => state.filters?.groupbuys?.category || 'all');
    const priceRange = useAppStore((state) => state.filters?.groupbuys?.priceRange || 'all');
    const status = useAppStore((state) => state.filters?.groupbuys?.status || 'all');
    const sort = useAppStore((state) => state.filters?.groupbuys?.sort || 'popularity');
    
    // Memoize filtered products to prevent infinite re-renders
    const products = useMemo(() => {
        if (!Array.isArray(rawProducts)) return [];
        
        const filtered = rawProducts.filter(product => {
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
    }, [rawProducts, orders, search, region, category, priceRange, status, sort]);
    
    const filtersState = useFilters();
    const { groupbuys: filters = {} } = filtersState || {};
    const updateGroupBuyFilters = useUpdateGroupBuyFilters();
    const joinGroupBuy = useJoinGroupBuy();
    const updateProduct = useUpdateProduct();
    const addOrder = useAddOrder();
    const updatePaymentStatus = useUpdatePaymentStatus();
    const user = useUser();
    
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
            const order = {
                id: orderId,
                productId: product.id,
                customerEmail: user.email,
                customerName: user.name,
                quantity,
                totalPrice: product.price * quantity,
                total: product.price * quantity,
                groupStatus: 'open',
                fulfillmentStatus: 'pending',
                paymentStatus: paymentData.escrow ? 'held' : 'paid',
                paymentIntentId: paymentData.paymentIntentId,
                paymentDate: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-8">
                <p className="text-gray-600 mb-2">Community bulk orders</p>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Group Buy Marketplace
                </h2>
                <p className="text-gray-600">
                    Find deals by category, price, and popularity
                </p>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search products, brands, or descriptions..."
                            value={search}
                            onChange={(e) => updateGroupBuyFilters({ search: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select 
                        value={category}
                        onChange={(e) => updateGroupBuyFilters({ category: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Categories</option>
                        <option value="food">🍜 Food & Beverages</option>
                        <option value="household">🏠 Household Items</option>
                        <option value="beauty">💄 Beauty & Personal Care</option>
                    </select>
                    <select 
                        value={region}
                        onChange={(e) => updateGroupBuyFilters({ region: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Regions</option>
                        <option value="Toronto">Toronto</option>
                        <option value="Hamilton">Hamilton</option>
                        <option value="Niagara">Niagara</option>
                    </select>
                    <select 
                        value={priceRange}
                        onChange={(e) => updateGroupBuyFilters({ priceRange: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {/* Results */}
            <div className="flex justify-between items-center mb-6">
                <span className="text-gray-600">{products.length} products available</span>
                <select 
                    value={sort}
                    onChange={(e) => updateGroupBuyFilters({ sort: e.target.value })}
                    className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="popularity">🔥 Popularity</option>
                    <option value="deadline">⏰ Deadline</option>
                    <option value="price-low">💰 Price: Low to High</option>
                    <option value="price-high">💰 Price: High to Low</option>
                    <option value="progress">📊 Progress</option>
                    <option value="newest">✨ Newest</option>
                </select>
            </div>

            {/* Products Grid */}
            {products.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.filter(p => p && p.id).map(product => (
                        <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                <span className="text-white text-4xl">🛒</span>
                            </div>
                            <div className="p-6">
                                <h3 className="font-semibold text-lg mb-2">{product.title || 'Untitled Product'}</h3>
                                <p className="text-gray-600 text-sm mb-4">{product.description || ''}</p>
                                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                                    <span>{product.region || 'Unknown'}</span>
                                    <span className="font-semibold text-lg text-gray-900">${product.price || 0}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full" 
                                        style={{ width: `${Math.min(((product.currentQuantity || 0) / (product.targetQuantity || 1)) * 100, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm text-gray-600">
                                        {product.currentQuantity || 0}/{product.targetQuantity || 0} committed
                                    </span>
                                    <span className="text-sm font-medium text-blue-600">
                                        {Math.round(((product.currentQuantity || 0) / (product.targetQuantity || 1)) * 100)}% funded
                                    </span>
                                </div>
                                <button 
                                    onClick={() => handleJoinGroupBuy(product)}
                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Join Group Buy
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">No group buys match your filters.</p>
                    <p className="text-gray-400">Try adjusting your search criteria.                    </p>
                </div>
            )}

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

export default GroupBuysPage;
