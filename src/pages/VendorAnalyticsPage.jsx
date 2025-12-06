/**
 * Vendor Analytics Dashboard
 * Displays sales metrics, charts, and top products for vendors
 */

import React, { useMemo } from 'react';
import { useUser, useProducts, useOrders } from '../stores';

const VendorAnalyticsPage = () => {
    const user = useUser();
    const products = useProducts();
    const orders = useOrders();

    // Calculate vendor metrics
    const metrics = useMemo(() => {
        if (!user?.email) return null;

        const vendorProducts = products.filter(p => p.ownerEmail === user.email);
        const vendorOrders = orders.filter(order => {
            const product = products.find(p => p.id === order.productId);
            return product && product.ownerEmail === user.email;
        });

        const completedOrders = vendorOrders.filter(o => o.fulfillmentStatus === 'completed');
        
        const totalSales = vendorOrders.reduce((sum, order) => 
            sum + (order.totalPrice || order.total || 0), 0
        );

        const platformFee = totalSales * 0.15; // 15% platform fee
        const earnings = totalSales - platformFee;

        // Calculate daily sales (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentOrders = vendorOrders.filter(order => 
            new Date(order.createdAt) >= sevenDaysAgo
        );

        const dailySales = {};
        recentOrders.forEach(order => {
            const date = new Date(order.createdAt).toLocaleDateString();
            dailySales[date] = (dailySales[date] || 0) + (order.totalPrice || order.total || 0);
        });

        // Top selling products
        const productSales = {};
        vendorOrders.forEach(order => {
            const productId = order.productId;
            if (!productSales[productId]) {
                productSales[productId] = {
                    product: products.find(p => p.id === productId),
                    quantity: 0,
                    revenue: 0
                };
            }
            productSales[productId].quantity += order.quantity;
            productSales[productId].revenue += (order.totalPrice || order.total || 0);
        });

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        return {
            totalSales,
            totalOrders: vendorOrders.length,
            completedOrders: completedOrders.length,
            earnings,
            platformFee,
            dailySales,
            topProducts,
            totalProducts: vendorProducts.length
        };
    }, [user, products, orders]);

    if (!user) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <p className="text-gray-500">Please sign in to view analytics.</p>
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <p className="text-gray-500">Loading analytics...</p>
            </div>
        );
    }

    // Prepare chart data
    const chartData = Object.entries(metrics.dailySales)
        .sort((a, b) => new Date(a[0]) - new Date(b[0]))
        .map(([date, sales]) => ({ date, sales }));

    const maxSales = Math.max(...chartData.map(d => d.sales), 1);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold mb-6">Analytics Dashboard</h2>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                        ${metrics.totalSales.toFixed(2)}
                    </div>
                    <div className="text-gray-600">Total Sales</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                        {metrics.completedOrders}
                    </div>
                    <div className="text-gray-600">Completed Orders</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="text-2xl font-bold text-purple-600 mb-2">
                        ${metrics.earnings.toFixed(2)}
                    </div>
                    <div className="text-gray-600">Earnings (After Fees)</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="text-2xl font-bold text-orange-600 mb-2">
                        {metrics.totalProducts}
                    </div>
                    <div className="text-gray-600">Total Products</div>
                </div>
            </div>

            {/* Sales Chart */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4">Daily Sales (Last 7 Days)</h3>
                {chartData.length > 0 ? (
                    <div className="space-y-2">
                        {chartData.map(({ date, sales }) => (
                            <div key={date} className="flex items-center space-x-4">
                                <div className="w-24 text-sm text-gray-600">{date}</div>
                                <div className="flex-1">
                                    <div className="bg-gray-200 rounded-full h-6 relative">
                                        <div
                                            className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                                            style={{ width: `${(sales / maxSales) * 100}%` }}
                                        >
                                            <span className="text-xs text-white font-medium">
                                                ${sales.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-8">No sales data for the last 7 days</p>
                )}
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
                {metrics.topProducts.length > 0 ? (
                    <div className="space-y-3">
                        {metrics.topProducts.map((item, index) => (
                            <div key={item.product?.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">
                                        {item.product?.title || 'Unknown Product'}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {item.quantity} units sold
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-gray-900">
                                        ${item.revenue.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-gray-500">Revenue</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-8">No product sales yet</p>
                )}
            </div>
        </div>
    );
};

export default VendorAnalyticsPage;

