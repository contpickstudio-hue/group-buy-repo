import { useMemo } from 'react';
import { useOrders, useProducts, useUser, useErrands, useCommunitySavings, useUserContribution } from '../stores';

const useAccountSummary = () => {
  const user = useUser();
  const orders = useOrders();
  const products = useProducts();
  const errands = useErrands();
  const communitySavings = useCommunitySavings();
  const userContribution = useUserContribution();

  return useMemo(() => {
    if (!user) {
      return {
        totalOrders: 0,
        totalProducts: 0,
        totalRevenue: 0,
        totalSavings: 0,
        totalEarnings: 0,
        groupBuysJoined: 0,
        errandsCompleted: 0,
        pendingOrders: 0,
        completedOrders: 0
      };
    }

    const userEmail = user.email || user.id;
    const userOrders = orders.filter(o => o && (o.customerEmail === userEmail || o.customerEmail === user.email));
    const userProducts = products.filter(p => p && p.ownerEmail === userEmail);
    const userErrands = errands.filter(e => e && e.requesterEmail === userEmail);

    // Calculate total savings from community savings or user contribution
    // Ensure it's a number, handling cases where it might be a string, object, or undefined
    const savingsValue = userContribution ?? communitySavings ?? 0;
    const totalSavings = Number(savingsValue) || 0;

    // Calculate total earnings from orders where user is vendor
    const vendorOrders = orders.filter(o => {
      const product = products.find(p => p && p.id === o.productId);
      return product && product.ownerEmail === userEmail;
    });
    const totalEarningsValue = vendorOrders.reduce((sum, order) => sum + (order.totalPrice || order.total || 0), 0);
    const totalEarnings = Number(totalEarningsValue) || 0;

    // Calculate total revenue
    const totalRevenueValue = userOrders.reduce((sum, order) => sum + (order.totalPrice || order.total || 0), 0);
    const totalRevenue = Number(totalRevenueValue) || 0;

    // Count group buys joined
    const groupBuysJoined = new Set(userOrders.map(o => o.productId)).size;

    // Count completed errands
    const errandsCompleted = userErrands.filter(e => e.status === 'completed').length;

    return {
      totalOrders: userOrders.length,
      totalProducts: userProducts.length,
      totalRevenue: totalRevenue,
      totalSavings: totalSavings,
      totalEarnings: totalEarnings,
      groupBuysJoined: groupBuysJoined || 0,
      errandsCompleted: errandsCompleted || 0,
      pendingOrders: userOrders.filter(o => o.status === 'pending').length,
      completedOrders: userOrders.filter(o => o.status === 'completed').length
    };
  }, [user, orders, products, errands, communitySavings, userContribution]);
};

export default useAccountSummary;

