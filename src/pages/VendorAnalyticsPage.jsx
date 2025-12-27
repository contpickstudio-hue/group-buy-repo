import React, { useMemo, useState, useEffect } from 'react';
import { 
  useUser, 
  useOrders, 
  useListings, 
  useErrands,
  useGetBatchesByListing,
  useGetListingsByOwner,
  useLoadOrders,
  useLoadListings,
  useLoadBatchesForListing,
  useLoadErrands
} from '../stores';
import { useAuthStore } from '../stores/authStore';
import { isGuestUser } from '../utils/authUtils';
import { DollarSign, ShoppingCart, Package, CheckCircle, Clock, Briefcase } from 'lucide-react';

const VendorAnalyticsPage = () => {
  const user = useUser();
  const loginMethod = useAuthStore((state) => state.loginMethod);
  const isGuest = isGuestUser(user, loginMethod);
  
  const orders = useOrders();
  const listings = useListings();
  const errands = useErrands();
  const getBatchesByListing = useGetBatchesByListing();
  const getListingsByOwner = useGetListingsByOwner();
  const loadOrders = useLoadOrders();
  const loadListings = useLoadListings();
  const loadBatchesForListing = useLoadBatchesForListing();
  const loadErrands = useLoadErrands();
  
  const [timeFilter, setTimeFilter] = useState('all'); // '7d', '30d', 'all'
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadOrders(),
          loadListings(),
          loadErrands()
        ]);
        
        // Load batches for vendor's listings
        const vendorListings = getListingsByOwner(user?.email || user?.id);
        for (const listing of vendorListings) {
          await loadBatchesForListing(listing.id);
        }
      } catch (error) {
        console.error('Error loading vendor analytics data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user && !isGuest) {
      loadData();
    }
  }, [user, isGuest, loadOrders, loadListings, loadErrands, loadBatchesForListing, getListingsByOwner]);

  // Get vendor's listings
  const vendorListings = useMemo(() => {
    if (!user || isGuest) return [];
    const ownerEmail = user.email || user.id;
    return getListingsByOwner(ownerEmail);
  }, [user, isGuest, listings, getListingsByOwner]);

  // Get all batches for vendor's listings
  const vendorBatches = useMemo(() => {
    const batchMap = new Map();
    vendorListings.forEach(listing => {
      const batches = getBatchesByListing(listing.id) || [];
      batches.forEach(batch => {
        batchMap.set(batch.id, { batch, listing });
      });
    });
    return batchMap;
  }, [vendorListings, getBatchesByListing]);

  // Get date filter threshold
  const dateThreshold = useMemo(() => {
    const now = new Date();
    switch (timeFilter) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return null; // All time
    }
  }, [timeFilter]);

  // Get vendor's orders filtered by time
  const vendorOrders = useMemo(() => {
    if (!user || isGuest) return [];
    
    const batchIds = Array.from(vendorBatches.keys());
    const filtered = orders.filter(order => {
      const batchId = order.regionalBatchId || order.regional_batch_id;
      if (!batchId || !batchIds.includes(batchId)) return false;
      
      // Apply time filter
      if (dateThreshold && order.createdAt) {
        const orderDate = new Date(order.createdAt);
        return orderDate >= dateThreshold;
      }
      
      return true;
    });
    
    return filtered;
  }, [orders, vendorBatches, dateThreshold, user, isGuest]);

  // Calculate analytics
  const analytics = useMemo(() => {
    // Total revenue (only from paid/released orders)
    const totalRevenue = vendorOrders
      .filter(order => {
        const paymentStatus = order.paymentStatus || order.payment_status;
        const escrowStatus = order.escrowStatus || order.escrow_status;
        // Count revenue from paid orders or released escrow
        return paymentStatus === 'paid' || escrowStatus === 'escrow_released';
      })
      .reduce((sum, order) => {
        return sum + parseFloat(order.totalPrice || order.total || 0);
      }, 0);

    // Total orders
    const totalOrders = vendorOrders.length;

    // Active vs completed batches
    const allBatches = Array.from(vendorBatches.values()).map(v => v.batch);
    const activeBatches = allBatches.filter(batch => {
      return batch.status === 'active' || batch.status === 'draft';
    });
    const completedBatches = allBatches.filter(batch => {
      return batch.status === 'successful' || batch.status === 'failed' || 
             batch.status === 'cancelled' || batch.status === 'delivered';
    });

    // Average order value
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Fulfilled vs pending orders
    const fulfilledOrders = vendorOrders.filter(order => {
      return order.fulfillmentStatus === 'fulfilled';
    });
    const pendingOrders = vendorOrders.filter(order => {
      return order.fulfillmentStatus !== 'fulfilled' && 
             order.fulfillmentStatus !== 'cancelled';
    });

    // Get errands completed count (where user is requester and status is completed)
    const userEmail = user?.email || user?.id;
    const completedErrands = errands.filter(e => 
      e.requesterEmail === userEmail && 
      e.status === 'completed'
    ).length;

    return {
      totalRevenue,
      totalOrders,
      activeBatches: activeBatches.length,
      completedBatches: completedBatches.length,
      avgOrderValue,
      fulfilledOrders: fulfilledOrders.length,
      pendingOrders: pendingOrders.length,
      completedErrands
    };
  }, [vendorOrders, vendorBatches, errands, user]);

  if (isGuest) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">
            Guest Preview Access
          </h2>
          <p className="text-yellow-700 mb-4">
            Vendor analytics are only available to registered users. Please sign up to access this feature.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Vendor Analytics</h1>
        <p className="text-gray-600">Track your sales performance and group buy activity</p>
      </div>

      {/* Time Filter */}
      <div className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setTimeFilter('7d')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timeFilter === '7d'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeFilter('30d')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timeFilter === '30d'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timeFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Revenue */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
            <DollarSign size={20} className="text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${analytics.totalRevenue.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            From {analytics.totalOrders} order{analytics.totalOrders !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Completed Group Buys */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Completed Group Buys</h3>
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {analytics.completedBatches}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {analytics.activeBatches} active
          </p>
        </div>

        {/* Errands Completed */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Errands Completed</h3>
            <Briefcase size={20} className="text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {analytics.completedErrands}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            As requester
          </p>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Orders</h3>
            <ShoppingCart size={20} className="text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {analytics.totalOrders}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Avg: ${analytics.avgOrderValue.toFixed(2)} per order
          </p>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Order Status Breakdown */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-green-600" />
                <span className="text-gray-700">Fulfilled</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {analytics.fulfilledOrders}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-yellow-600" />
                <span className="text-gray-700">Pending</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {analytics.pendingOrders}
              </span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Total</span>
                <span className="text-lg font-semibold text-gray-900">
                  {analytics.totalOrders}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Group Buy Status Breakdown */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Buy Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-blue-600" />
                <span className="text-gray-700">Active</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {analytics.activeBatches}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-gray-600" />
                <span className="text-gray-700">Completed</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {analytics.completedBatches}
              </span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Total</span>
                <span className="text-lg font-semibold text-gray-900">
                  {analytics.activeBatches + analytics.completedBatches}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Average Order Value</p>
            <p className="text-2xl font-bold text-gray-900">
              ${analytics.avgOrderValue.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Fulfillment Rate</p>
            <p className="text-2xl font-bold text-gray-900">
              {analytics.totalOrders > 0 
                ? `${((analytics.fulfilledOrders / analytics.totalOrders) * 100).toFixed(1)}%`
                : '0.0%'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Active Rate</p>
            <p className="text-2xl font-bold text-gray-900">
              {analytics.activeBatches + analytics.completedBatches > 0
                ? `${((analytics.activeBatches / (analytics.activeBatches + analytics.completedBatches)) * 100).toFixed(1)}%`
                : '0.0%'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorAnalyticsPage;
