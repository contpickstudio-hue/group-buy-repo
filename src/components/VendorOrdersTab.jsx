import React, { useMemo, useState, useEffect } from 'react';
import { 
  useUser, 
  useOrders, 
  useListings, 
  useGetBatchesByListing,
  useGetListingsByOwner,
  useUpdateFulfillmentStatus,
  useLoadOrders,
  useLoadListings,
  useLoadBatchesForListing
} from '../stores';
import { Package, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

const VendorOrdersTab = () => {
  const user = useUser();
  const orders = useOrders();
  const listings = useListings();
  const getBatchesByListing = useGetBatchesByListing();
  const getListingsByOwner = useGetListingsByOwner();
  const updateFulfillmentStatus = useUpdateFulfillmentStatus();
  const loadOrders = useLoadOrders();
  const loadListings = useLoadListings();
  const loadBatchesForListing = useLoadBatchesForListing();
  
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [updatingOrders, setUpdatingOrders] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadOrders(),
          loadListings()
        ]);
        
        // Load batches for vendor's listings
        const vendorListings = getListingsByOwner(user?.email || user?.id);
        for (const listing of vendorListings) {
          await loadBatchesForListing(listing.id);
        }
      } catch (error) {
        console.error('Error loading vendor orders data:', error);
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      loadData();
    }
  }, [user, loadOrders, loadListings, loadBatchesForListing, getListingsByOwner]);

  // Get vendor's listings
  const vendorListings = useMemo(() => {
    if (!user) return [];
    const ownerEmail = user.email || user.id;
    return getListingsByOwner(ownerEmail);
  }, [user, listings, getListingsByOwner]);

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

  // Get orders for vendor's batches and group by listing/batch
  const groupedOrders = useMemo(() => {
    const groups = new Map();
    
    // Get all batch IDs for vendor
    const batchIds = Array.from(vendorBatches.keys());
    
    // Filter orders for vendor's batches
    const vendorOrders = orders.filter(order => {
      const batchId = order.regionalBatchId || order.regional_batch_id;
      return batchId && batchIds.includes(batchId);
    });
    
    // Group orders by listing and batch
    vendorOrders.forEach(order => {
      const batchId = order.regionalBatchId || order.regional_batch_id;
      const batchInfo = vendorBatches.get(batchId);
      
      if (!batchInfo) return;
      
      const { batch, listing } = batchInfo;
      const groupKey = `${listing.id}_${batch.id}`;
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          listing,
          batch,
          orders: []
        });
      }
      
      groups.get(groupKey).orders.push(order);
    });
    
    // Convert to array and sort by listing title, then batch region
    return Array.from(groups.values()).sort((a, b) => {
      const titleCompare = (a.listing.title || '').localeCompare(b.listing.title || '');
      if (titleCompare !== 0) return titleCompare;
      return (a.batch.region || '').localeCompare(b.batch.region || '');
    });
  }, [orders, vendorBatches]);

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const handleMarkFulfilled = async (orderId) => {
    if (updatingOrders.has(orderId)) return;
    
    setUpdatingOrders(prev => new Set(prev).add(orderId));
    
    try {
      const result = await updateFulfillmentStatus(orderId, 'fulfilled');
      
      if (result.success) {
        toast.success('Order marked as fulfilled');
      } else {
        throw new Error(result.error || 'Failed to mark order as fulfilled');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to mark order as fulfilled');
    } finally {
      setUpdatingOrders(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  const getFulfillmentStatusColor = (status) => {
    switch (status) {
      case 'fulfilled':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFulfillmentStatusLabel = (status) => {
    switch (status) {
      case 'fulfilled':
        return 'Fulfilled';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status || 'Pending';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      case 'authorized':
        return 'bg-purple-100 text-purple-800';
      case 'refunded':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading orders...</span>
        </div>
      </div>
    );
  }

  if (groupedOrders.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Vendor Orders</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
          <EmptyStateWithAction 
            type="orders"
          />
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalOrders = groupedOrders.reduce((sum, group) => sum + group.orders.length, 0);
  const totalRevenue = groupedOrders.reduce((sum, group) => {
    return sum + group.orders.reduce((groupSum, order) => {
      return groupSum + (parseFloat(order.totalPrice || order.total || 0));
    }, 0);
  }, 0);

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Vendor Orders</h2>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <span>
            <strong className="text-gray-900">{totalOrders}</strong> total orders
          </span>
          <span>
            <strong className="text-gray-900">${totalRevenue.toFixed(2)}</strong> total revenue
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {groupedOrders.map((group) => {
          const groupKey = `${group.listing.id}_${group.batch.id}`;
          const isExpanded = expandedGroups.has(groupKey);
          const pendingOrders = group.orders.filter(o => o.fulfillmentStatus !== 'fulfilled');
          const fulfilledOrders = group.orders.filter(o => o.fulfillmentStatus === 'fulfilled');
          
          return (
            <div key={groupKey} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Group Header */}
              <div 
                className="bg-white p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleGroup(groupKey)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {group.listing.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Package size={14} />
                        {group.batch.region}
                      </span>
                      <span>
                        {group.orders.length} order{group.orders.length !== 1 ? 's' : ''}
                      </span>
                      {pendingOrders.length > 0 && (
                        <span className="text-yellow-600 font-medium">
                          {pendingOrders.length} pending
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="p-1 text-gray-600 hover:text-gray-900"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGroup(groupKey);
                    }}
                  >
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
              </div>

              {/* Expanded Orders List */}
              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50">
                  {group.orders.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No orders for this batch
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Buyer
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantity
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Price
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Payment
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {group.orders.map((order) => {
                            const isFulfilled = order.fulfillmentStatus === 'fulfilled';
                            const isUpdating = updatingOrders.has(order.id);
                            
                            return (
                              <tr key={order.id} className={isFulfilled ? 'bg-green-50' : ''}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-medium text-gray-900">
                                      {order.customerName || order.customerEmail?.split('@')[0] || 'Customer'}
                                    </h4>
                                    {isFulfilled && (
                                      <CheckCircle size={16} className="text-green-600" />
                                    )}
                                  </div>
                                  {order.createdAt && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {new Date(order.createdAt).toLocaleDateString()}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {order.quantity || 1}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  ${parseFloat(order.totalPrice || order.total || 0).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFulfillmentStatusColor(order.fulfillmentStatus)}`}>
                                    {getFulfillmentStatusLabel(order.fulfillmentStatus)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                                    {order.paymentStatus === 'authorized' ? 'In Escrow' : 
                                     order.paymentStatus === 'paid' ? 'Paid' :
                                     order.paymentStatus === 'refunded' ? 'Refunded' :
                                     order.paymentStatus || 'Pending'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  {!isFulfilled ? (
                                    <button
                                      onClick={() => handleMarkFulfilled(order.id)}
                                      disabled={isUpdating}
                                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                                    >
                                      {isUpdating ? (
                                        <>
                                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                          Updating...
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle size={16} />
                                          Mark Fulfilled
                                        </>
                                      )}
                                    </button>
                                  ) : (
                                    <div className="px-4 py-2 bg-green-100 text-green-800 rounded-md text-sm font-medium flex items-center gap-2 whitespace-nowrap">
                                      <CheckCircle size={16} />
                                      Fulfilled
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VendorOrdersTab;
