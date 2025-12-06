/**
 * My Orders Page
 * Displays customer's orders with progress tracking
 */

import React from 'react';
import { useUser, useOrders, useProducts } from '../stores';

const MyOrdersPage = () => {
    const user = useUser();
    const orders = useOrders();
    const products = useProducts();

    // Get customer's orders
    const customerOrders = React.useMemo(() => {
        if (!user?.email) return [];
        return orders
            .filter(order => order.customerEmail === user.email)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [orders, user]);

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            preparing: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getGroupBuyStatus = (order) => {
        const product = products.find(p => p.id === order.productId);
        if (!product) return 'unknown';

        const progress = product.targetQuantity > 0 
            ? (product.currentQuantity / product.targetQuantity) * 100 
            : 0;
        const deadline = product.deadline ? new Date(product.deadline) : null;
        const daysLeft = deadline ? Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)) : null;

        if (progress >= 100) return { status: 'success', message: 'Group buy successful!' };
        if (daysLeft !== null && daysLeft <= 0) return { status: 'failed', message: 'Group buy expired' };
        if (daysLeft !== null && daysLeft <= 3) return { status: 'warning', message: `Only ${daysLeft} days left` };
        return { status: 'open', message: `${Math.round(progress)}% filled` };
    };

    if (!user) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <p className="text-gray-500">Please sign in to view your orders.</p>
            </div>
        );
    }

    if (customerOrders.length === 0) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h2 className="text-2xl font-bold mb-6">My Orders</h2>
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <p className="text-gray-500 mb-2">No orders yet</p>
                    <p className="text-sm text-gray-400">Start shopping to see your orders here</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold mb-6">My Orders ({customerOrders.length})</h2>

            <div className="space-y-4">
                {customerOrders.map(order => {
                    const product = products.find(p => p.id === order.productId);
                    const groupBuyStatus = getGroupBuyStatus(order);

                    return (
                        <div key={order.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        {product?.title || 'Product'}
                                    </h3>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p><strong>Vendor:</strong> {product?.vendor || 'Unknown'}</p>
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

                            {/* Group Buy Status */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-1">Group Buy Status</p>
                                        <p className={`text-sm ${
                                            groupBuyStatus.status === 'success' ? 'text-green-600' :
                                            groupBuyStatus.status === 'failed' ? 'text-red-600' :
                                            groupBuyStatus.status === 'warning' ? 'text-yellow-600' :
                                            'text-gray-600'
                                        }`}>
                                            {groupBuyStatus.message}
                                        </p>
                                    </div>
                                    {product && (
                                        <div className="text-right">
                                            <p className="text-sm text-gray-600">
                                                {product.currentQuantity} / {product.targetQuantity} units
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Delivery/Pickup Info */}
                            {(order.deliveryInfo || order.pickupInfo) && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Delivery Information</p>
                                    {order.deliveryInfo && (
                                        <div className="text-sm text-gray-600">
                                            <p>Address: {order.deliveryInfo.address || 'N/A'}</p>
                                            <p>Date: {order.deliveryInfo.date || 'TBD'}</p>
                                        </div>
                                    )}
                                    {order.pickupInfo && (
                                        <div className="text-sm text-gray-600">
                                            <p>Pickup Location: {order.pickupInfo.location || 'N/A'}</p>
                                            <p>Date: {order.pickupInfo.date || 'TBD'}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Order Progress Steps */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center justify-between text-xs">
                                    <div className={`flex-1 ${order.fulfillmentStatus === 'pending' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                                        <div className="w-2 h-2 rounded-full bg-current mx-auto mb-1"></div>
                                        Pending
                                    </div>
                                    <div className={`flex-1 ${order.fulfillmentStatus === 'preparing' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                                        <div className="w-2 h-2 rounded-full bg-current mx-auto mb-1"></div>
                                        Preparing
                                    </div>
                                    <div className={`flex-1 ${order.fulfillmentStatus === 'completed' ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                                        <div className="w-2 h-2 rounded-full bg-current mx-auto mb-1"></div>
                                        Completed
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MyOrdersPage;

