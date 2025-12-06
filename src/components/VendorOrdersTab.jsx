/**
 * Vendor Orders Tab Component
 * Displays orders for vendor's products with status management
 */

import React from 'react';
import { useProducts, useOrders, useUpdateFulfillmentStatus, useUser } from '../stores';

const VendorOrdersTab = () => {
    const products = useProducts();
    const orders = useOrders();
    const updateFulfillmentStatus = useUpdateFulfillmentStatus();
    const user = useUser();

    // Get orders for vendor's products
    const vendorOrders = React.useMemo(() => {
        if (!user?.email) return [];
        
        const vendorProductIds = products
            .filter(p => p.ownerEmail === user.email)
            .map(p => p.id);
        
        return orders.filter(order => 
            vendorProductIds.includes(order.productId)
        ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [products, orders, user]);

    const handleStatusUpdate = async (orderId, newStatus) => {
        const result = await updateFulfillmentStatus(orderId, newStatus);
        if (!result.success) {
            alert(`Failed to update status: ${result.error}`);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            preparing: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusOptions = (currentStatus) => {
        const statusFlow = {
            pending: ['preparing', 'cancelled'],
            preparing: ['completed', 'cancelled'],
            completed: [],
            cancelled: []
        };
        return statusFlow[currentStatus] || [];
    };

    if (!user) {
        return <div className="text-center py-8 text-gray-500">Please sign in to view orders.</div>;
    }

    if (vendorOrders.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500 mb-2">No orders yet</p>
                <p className="text-sm text-gray-400">Orders for your products will appear here</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Your Orders ({vendorOrders.length})</h3>
            </div>

            <div className="space-y-3">
                {vendorOrders.map(order => {
                    const product = products.find(p => p.id === order.productId);
                    const statusOptions = getStatusOptions(order.fulfillmentStatus || 'pending');

                    return (
                        <div key={order.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <div className="font-semibold text-gray-900 mb-1">
                                        {product?.title || 'Product'}
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p><strong>Buyer:</strong> {order.customerName || order.customerEmail}</p>
                                        <p><strong>Quantity:</strong> {order.quantity}</p>
                                        <p><strong>Total:</strong> ${(order.totalPrice || order.total || 0).toFixed(2)}</p>
                                        <p><strong>Order Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.fulfillmentStatus || 'pending')}`}>
                                        {order.fulfillmentStatus || 'pending'}
                                    </span>
                                </div>
                            </div>

                            {statusOptions.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Update Status:
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {statusOptions.map(status => (
                                            <button
                                                key={status}
                                                onClick={() => handleStatusUpdate(order.id, status)}
                                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                            >
                                                Mark as {status}
                                            </button>
                                        ))}
                                    </div>
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

