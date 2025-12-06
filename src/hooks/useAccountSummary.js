import { useMemo } from 'react';
import { useUser, useOrders, useProducts, useErrands, useCustomerMetrics, useVendorMetrics, useHelperMetrics } from '../stores';

/**
 * Custom hook to fetch and calculate account summary data
 * Returns Total Savings, Total Earnings, Group Buys Joined, and Errands Completed
 */
const useAccountSummary = () => {
    const user = useUser();
    const orders = useOrders() || [];
    const products = useProducts() || [];
    const errands = useErrands() || [];
    
    // Get role-specific metrics
    const customerMetrics = useCustomerMetrics();
    const vendorMetrics = useVendorMetrics();
    const helperMetrics = useHelperMetrics();

    const accountSummary = useMemo(() => {
        if (!user) {
            return {
                totalSavings: 0,
                totalEarnings: 0,
                groupBuysJoined: 0,
                errandsCompleted: 0,
                isLoading: false
            };
        }

        const roles = user.roles || [];
        
        // Calculate Total Savings (from customer role)
        let totalSavings = 0;
        if (roles.includes('customer') && customerMetrics) {
            totalSavings = customerMetrics.totalSavings || 0;
        }

        // Calculate Total Earnings (from vendor and helper roles)
        let totalEarnings = 0;
        if (roles.includes('vendor') && vendorMetrics) {
            totalEarnings += vendorMetrics.totalRevenue || 0;
        }
        if (roles.includes('helper') && helperMetrics) {
            totalEarnings += helperMetrics.totalEarnings || 0;
        }

        // Calculate Group Buys Joined (customer orders)
        let groupBuysJoined = 0;
        if (roles.includes('customer')) {
            const customerOrders = orders.filter(
                order => order && order.customerEmail === user.email
            );
            groupBuysJoined = customerOrders.length;
        }

        // Calculate Errands Completed (helper role)
        let errandsCompleted = 0;
        if (roles.includes('helper')) {
            const completedErrands = errands.filter(
                errand => errand && 
                errand.assignedHelperEmail === user.email && 
                errand.status === 'completed'
            );
            errandsCompleted = completedErrands.length;
        }

        return {
            totalSavings,
            totalEarnings,
            groupBuysJoined,
            errandsCompleted,
            isLoading: false
        };
    }, [user, orders, products, errands, customerMetrics, vendorMetrics, helperMetrics]);

    return accountSummary;
};

export default useAccountSummary;

