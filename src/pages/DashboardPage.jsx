import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useUser, useProducts, useOrders, useErrands, useSetCurrentScreen, useAppStore, useLoadProducts } from '../stores';
import { 
  useCommunitySavings, 
  useUserContribution,
  useLoadCommunityStats,
  useLoadUserContribution,
  useCredits,
  useLoadCredits,
  useReferralStats,
  useLoadReferralStats,
  useGenerateReferralCode,
  useLoadReferralCodeFromStorage
} from '../stores';
import CreateGroupBuyForm from '../components/CreateGroupBuyForm';
import VendorOrdersTab from '../components/VendorOrdersTab';
import VendorAnalyticsPage from './VendorAnalyticsPage';
import PayoutSettingsPage from './PayoutSettingsPage';
import useAccountSummary from '../hooks/useAccountSummary';
import CommunitySavings from '../components/CommunitySavings';
import ReferralShare from '../components/ReferralShare';
import ReferralBadges from '../components/ReferralBadges';
import CreditsDisplay from '../components/CreditsDisplay';

const DashboardPage = () => {
    try {
        const user = useUser();
    const accountSummary = useAccountSummary();
    const products = useProducts();
    const orders = useOrders();
    const errands = useErrands();
    const setCurrentScreen = useSetCurrentScreen();
    const loadProducts = useLoadProducts();
    const prevProductsLengthRef = useRef(products?.length || 0);
    
    // Community stats hooks
    const loadCommunityStats = useLoadCommunityStats();
    const loadUserContribution = useLoadUserContribution();
    const communitySavings = useCommunitySavings();
    const userContribution = useUserContribution();
    
    // Credits hooks
    const loadCredits = useLoadCredits();
    const credits = useCredits();
    
    // Referral hooks
    const loadReferralStats = useLoadReferralStats();
    const generateReferralCode = useGenerateReferralCode();
    const loadReferralCodeFromStorage = useLoadReferralCodeFromStorage();
    const referralStats = useReferralStats();

    // Load data on mount
    useEffect(() => {
      if (user) {
        loadCommunityStats();
        loadUserContribution();
        loadCredits();
        loadReferralStats();
        // Try to load from storage first, then generate if needed
        // Load referral code from storage first, then generate if needed
        loadReferralCodeFromStorage().then(() => {
          const currentCode = useAppStore.getState().referralCode;
          if (!currentCode) {
            // Generate if not found in storage
            generateReferralCode().catch((err) => {
              console.error('Failed to generate referral code:', err);
            });
          }
        }).catch((err) => {
          // If loading fails, try to generate a new one
          console.warn('Failed to load referral code from storage, generating new one:', err);
          generateReferralCode().catch((genErr) => {
            console.error('Failed to generate referral code:', genErr);
          });
        });
      }
    }, [user, loadCommunityStats, loadUserContribution, loadCredits, loadReferralStats, generateReferralCode, loadReferralCodeFromStorage]);

    if (!user) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center">
                    <p className="text-gray-500">Please sign in to view your dashboard.</p>
                </div>
            </div>
        );
    }

    const roles = user.roles || [];
    const [activeTab, setActiveTab] = useState('overview');

    // Calculate user's active and completed items
    // Use products.length as additional dependency to ensure recalculation when products are added
    const userData = useMemo(() => {
        const userEmail = user.email || user.id;
        
        // Helper function to check if a product is active
        const isProductActive = (product) => {
            if (!product) return false;
            const progress = product.targetQuantity > 0 
                ? (product.currentQuantity / product.targetQuantity) * 100 
                : 0;
            const deadline = product.deadline ? new Date(product.deadline) : null;
            const daysLeft = deadline ? Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)) : null;
            return progress < 100 && daysLeft !== null && daysLeft > 0;
        };
        
        // Helper function to check if a product is completed
        const isProductCompleted = (product, order = null) => {
            if (!product) return false;
            const progress = product.targetQuantity > 0 
                ? (product.currentQuantity / product.targetQuantity) * 100 
                : 0;
            return progress >= 100 || (order && order.fulfillmentStatus === 'completed');
        };
        
        // Active group buys where user has orders (as customer)
        const userOrders = orders.filter(o => o.customerEmail === userEmail);
        const activeGroupBuysFromOrders = userOrders
            .filter(o => {
                const product = products.find(p => p.id === o.productId);
                return isProductActive(product);
            })
            .map(o => {
                const product = products.find(p => p.id === o.productId);
                return { ...o, product, role: 'customer' };
            });
        
        // Active group buys created by user (as vendor/owner)
        const activeGroupBuysAsVendor = products
            .filter(p => (p.ownerEmail === userEmail || p.owner_email === userEmail))
            .filter(p => isProductActive(p))
            .map(product => {
                // Find if user also has an order for this product
                const userOrder = userOrders.find(o => o.productId === product.id);
                return {
                    ...(userOrder || { 
                        id: `vendor-${product.id}`,
                        productId: product.id,
                        customerEmail: userEmail,
                        quantity: 0,
                        totalPrice: 0,
                        groupStatus: 'open',
                        fulfillmentStatus: 'pending'
                    }),
                    product,
                    role: 'vendor'
                };
            });
        
        // Combine and deduplicate active group buys
        const activeGroupBuysMap = new Map();
        [...activeGroupBuysFromOrders, ...activeGroupBuysAsVendor].forEach(item => {
            const key = item.productId;
            if (!activeGroupBuysMap.has(key)) {
                activeGroupBuysMap.set(key, item);
            } else {
                // If user is both vendor and customer, prioritize vendor role
                if (item.role === 'vendor') {
                    activeGroupBuysMap.set(key, item);
                }
            }
        });
        const activeGroupBuys = Array.from(activeGroupBuysMap.values());

        // Completed group buys where user has orders (as customer)
        const completedGroupBuysFromOrders = userOrders
            .filter(o => {
                const product = products.find(p => p.id === o.productId);
                return isProductCompleted(product, o);
            })
            .map(o => {
                const product = products.find(p => p.id === o.productId);
                return { ...o, product, role: 'customer' };
            });
        
        // Completed group buys created by user (as vendor/owner)
        const completedGroupBuysAsVendor = products
            .filter(p => (p.ownerEmail === userEmail || p.owner_email === userEmail))
            .filter(p => isProductCompleted(p))
            .map(product => {
                const userOrder = userOrders.find(o => o.productId === product.id);
                return {
                    ...(userOrder || { 
                        id: `vendor-${product.id}`,
                        productId: product.id,
                        customerEmail: userEmail,
                        quantity: 0,
                        totalPrice: 0,
                        groupStatus: 'closed',
                        fulfillmentStatus: 'completed'
                    }),
                    product,
                    role: 'vendor'
                };
            });
        
        // Combine and deduplicate completed group buys
        const completedGroupBuysMap = new Map();
        [...completedGroupBuysFromOrders, ...completedGroupBuysAsVendor].forEach(item => {
            const key = item.productId;
            if (!completedGroupBuysMap.has(key)) {
                completedGroupBuysMap.set(key, item);
            } else {
                if (item.role === 'vendor') {
                    completedGroupBuysMap.set(key, item);
                }
            }
        });
        const completedGroupBuys = Array.from(completedGroupBuysMap.values());

        // Active errands (user is requester)
        const activeErrands = errands.filter(e => 
            e.requesterEmail === userEmail && 
            e.status !== 'completed' && 
            e.status !== 'cancelled'
        );

        // Completed errands
        const completedErrands = errands.filter(e => 
            e.requesterEmail === userEmail && 
            (e.status === 'completed' || e.status === 'cancelled')
        );

        return {
            activeGroupBuys,
            completedGroupBuys,
            activeErrands,
            completedErrands
        };
    }, [user, orders, products, errands, products?.length]);
    
    // Track products changes to ensure dashboard updates when new products are created
    // The useMemo above should recalculate when products or products.length changes
    // This effect helps ensure the component is aware of product changes
    useEffect(() => {
        const currentProductsLength = products?.length || 0;
        prevProductsLengthRef.current = currentProductsLength;
    }, [products, products?.length]);

    // Tab configuration based on user roles
    const tabs = [];
    if (roles.includes('vendor')) {
        tabs.push({ id: 'overview', label: 'Overview' });
        tabs.push({ id: 'orders', label: 'Orders' });
        tabs.push({ id: 'analytics', label: 'Analytics' });
        tabs.push({ id: 'payouts', label: 'Payout Settings' });
    } else {
        tabs.push({ id: 'overview', label: 'Overview' });
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome, {user.name}
                </h2>
                <p className="text-gray-600">
                    Track tasks, payouts, and requests in one place.
                </p>
            </div>

            {/* Tabs */}
            {tabs.length > 1 && (
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            )}

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <>
                    {/* Account Info */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <h3 className="text-xl font-semibold mb-4">Your Account</h3>
                        <div className="space-y-2">
                            <p>
                                <strong>Roles:</strong> {roles.map(role => role.toUpperCase()).join(', ')}
                            </p>
                            {roles.includes('helper') && (
                                <p>
                                    <strong>Helper Status:</strong> {user.helperVerified ? 'Verified ✅' : 'Pending Verification'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Community Savings - Prominent Display */}
                    <div className="mb-8">
                        <CommunitySavings compact={false} />
                    </div>

                    {/* Account Summary - Stacked on mobile */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow-md p-6 text-center">
                            <div className="text-2xl font-bold text-blue-600 mb-2">
                                ${(Number(accountSummary?.totalSavings) || 0).toFixed(2)}
                            </div>
                            <div className="text-gray-600">Total Savings</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-6 text-center">
                            <div className="text-2xl font-bold text-green-600 mb-2">
                                ${(Number(accountSummary?.totalEarnings) || 0).toFixed(2)}
                            </div>
                            <div className="text-gray-600">Total Earnings</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-6 text-center">
                            <div className="text-2xl font-bold text-purple-600 mb-2">
                                {accountSummary.groupBuysJoined}
                            </div>
                            <div className="text-gray-600">Group Buys Joined</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-6 text-center">
                            <div className="text-2xl font-bold text-orange-600 mb-2">
                                {accountSummary.errandsCompleted}
                            </div>
                            <div className="text-gray-600">Errands Completed</div>
                        </div>
                    </div>

                    {/* Credits and Referrals Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Credits Display */}
                        <CreditsDisplay showHistory={false} compact={false} />
                        
                        {/* Referral Share */}
                        <ReferralShare />
                    </div>

                    {/* Referral Badges */}
                    <div className="mb-8">
                        <ReferralBadges />
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => setCurrentScreen('groupbuys')}
                                className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[48px] font-semibold"
                            >
                                <span className="mr-2">🛒</span>
                                Create Group Buy
                            </button>
                            <button
                                onClick={() => setCurrentScreen('errands')}
                                className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors min-h-[48px] font-semibold"
                            >
                                <span className="mr-2">📝</span>
                                Post Errand
                            </button>
                        </div>
                    </div>

                    {/* Active Group Buys - Mobile optimized */}
                    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
                        <h3 className="text-lg sm:text-xl font-semibold mb-4">Active Group Buys</h3>
                        {userData.activeGroupBuys.length > 0 ? (
                            <div className="space-y-4">
                                {userData.activeGroupBuys.slice(0, 5).map(order => (
                                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">
                                                {order.product?.title || 'Product'}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {order.quantity} unit{order.quantity > 1 ? 's' : ''} • ${(order.totalPrice || order.total || 0).toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {order.product && (
                                                <div>
                                                    {order.product.currentQuantity} / {order.product.targetQuantity} units
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">No active group buys</p>
                        )}
                    </div>

                    {/* Active Errands - Mobile optimized */}
                    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
                        <h3 className="text-lg sm:text-xl font-semibold mb-4">Active Errands</h3>
                        {userData.activeErrands.length > 0 ? (
                            <div className="space-y-4">
                                {userData.activeErrands.slice(0, 5).map(errand => (
                                    <div key={errand.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">
                                                {errand.title}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {errand.region} • ${errand.budget || 0}
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            errand.status === 'open' ? 'bg-green-100 text-green-800' :
                                            errand.status === 'matched' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {errand.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">No active errands</p>
                        )}
                    </div>

                    {/* Completed Items */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-xl font-semibold mb-4">Completed Items</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Group Buys</h4>
                                <div className="text-2xl font-bold text-green-600">
                                    {userData.completedGroupBuys.length}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Errands</h4>
                                <div className="text-2xl font-bold text-green-600">
                                    {userData.completedErrands.length}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Role-specific sections */}
                    {roles.includes('vendor') && (
                        <div className="mt-8">
                            <CreateGroupBuyForm />
                        </div>
                    )}
                </>
            )}

            {activeTab === 'orders' && roles.includes('vendor') && (
                <VendorOrdersTab />
            )}

            {activeTab === 'analytics' && roles.includes('vendor') && (
                <VendorAnalyticsPage />
            )}

            {activeTab === 'payouts' && roles.includes('vendor') && (
                <PayoutSettingsPage />
            )}
        </div>
    );
    } catch (error) {
        console.error('DashboardPage error:', error);
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                        Unable to Load Dashboard
                    </h3>
                    <p className="text-red-600 mb-4">
                        There was an error loading your dashboard. Please try refreshing the page.
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

export default DashboardPage;
