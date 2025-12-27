import { useMemo } from 'react';
import { useOrders, useProducts, useUser } from '../stores';

const useAccountSummary = () => {
  const user = useUser();
  const orders = useOrders();
  const products = useProducts();

  return useMemo(() => {
    if (!user) {
      return {
        totalOrders: 0,
        totalProducts: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        completedOrders: 0
      };
    }

    const userOrders = orders.filter(o => o.customerEmail === user.email);
    const userProducts = products.filter(p => p.ownerEmail === user.email);

    return {
      totalOrders: userOrders.length,
      totalProducts: userProducts.length,
      totalRevenue: userOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0),
      pendingOrders: userOrders.filter(o => o.status === 'pending').length,
      completedOrders: userOrders.filter(o => o.status === 'completed').length
    };
  }, [user, orders, products]);
};

export default useAccountSummary;

