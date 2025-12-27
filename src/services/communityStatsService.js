import { supabaseClient } from './supabaseService';
import { apiCall } from './errorService';

/**
 * Community Stats Service
 * Handles calculation and retrieval of community savings statistics
 */

/**
 * Get total community savings
 */
export async function getCommunitySavings() {
  return await apiCall(async () => {
    // Try to use the RPC function first
    const { data, error: rpcError } = await supabaseClient
      .rpc('get_community_savings');

    if (!rpcError && data !== null && data !== undefined) {
      const parsed = parseFloat(data);
      // Ensure we return a valid number (not NaN)
      if (typeof parsed === 'number' && !isNaN(parsed)) {
        return parsed;
      }
    }

    // Fallback to manual calculation
    const { data: orders, error } = await supabaseClient
      .from('orders')
      .select(`
        total_price,
        product_id,
        products!inner (
          current_quantity,
          target_quantity
        )
      `)
      .eq('fulfillment_status', 'completed');

    if (error) {
      throw error;
    }

    // Calculate savings (15% of total price for completed group buys that reached target)
    const totalSavings = (orders || [])
      .filter(order => {
        const product = order.products;
        return product && 
               product.current_quantity >= product.target_quantity && 
               product.target_quantity > 0;
      })
      .reduce((sum, order) => {
        const price = parseFloat(order.total_price) || 0;
        const savings = price * 0.15;
        // Ensure we're adding valid numbers
        return sum + (typeof savings === 'number' && !isNaN(savings) ? savings : 0);
      }, 0);

    // Ensure we return a valid number (not NaN)
    return (typeof totalSavings === 'number' && !isNaN(totalSavings)) ? totalSavings : 0;
  });
}

/**
 * Get user's contribution to community savings
 */
export async function getUserContribution(userEmail) {
  return await apiCall(async () => {
    if (!userEmail) {
      return 0;
    }

    // Try to use the RPC function first
    const { data, error: rpcError } = await supabaseClient
      .rpc('get_user_community_contribution', { user_email_param: userEmail });

    if (!rpcError && data !== null && data !== undefined) {
      const parsed = parseFloat(data);
      // Ensure we return a valid number (not NaN)
      if (typeof parsed === 'number' && !isNaN(parsed)) {
        return parsed;
      }
    }

    // Fallback to manual calculation
    const { data: orders, error } = await supabaseClient
      .from('orders')
      .select(`
        total_price,
        product_id,
        products!inner (
          current_quantity,
          target_quantity
        )
      `)
      .eq('customer_email', userEmail)
      .eq('fulfillment_status', 'completed');

    if (error) {
      throw error;
    }

    // Calculate user's contribution
    const contribution = (orders || [])
      .filter(order => {
        const product = order.products;
        return product && 
               product.current_quantity >= product.target_quantity && 
               product.target_quantity > 0;
      })
      .reduce((sum, order) => {
        const price = parseFloat(order.total_price) || 0;
        const savings = price * 0.15;
        // Ensure we're adding valid numbers
        return sum + (typeof savings === 'number' && !isNaN(savings) ? savings : 0);
      }, 0);

    // Ensure we return a valid number (not NaN)
    return (typeof contribution === 'number' && !isNaN(contribution)) ? contribution : 0;
  });
}

/**
 * Get top contributors
 */
export async function getTopContributors(limit = 10) {
  return await apiCall(async () => {
    // Try to use the RPC function first
    const { data, error: rpcError } = await supabaseClient
      .rpc('get_top_contributors', { limit_count: limit });

    if (!rpcError && data) {
      return data.map(item => ({
        userEmail: item.user_email,
        contribution: parseFloat(item.contribution) || 0,
        ordersCount: parseInt(item.orders_count) || 0
      }));
    }

    // Fallback to manual calculation
    const { data: orders, error } = await supabaseClient
      .from('orders')
      .select(`
        customer_email,
        total_price,
        product_id,
        products!inner (
          current_quantity,
          target_quantity
        )
      `)
      .eq('fulfillment_status', 'completed');

    if (error) {
      throw error;
    }

    // Filter completed group buys and calculate contributions
    const contributions = {};
    
    (orders || []).forEach(order => {
      const product = order.products;
      if (product && 
          product.current_quantity >= product.target_quantity && 
          product.target_quantity > 0) {
        const email = order.customer_email;
        const savings = (parseFloat(order.total_price) || 0) * 0.15;
        
        if (!contributions[email]) {
          contributions[email] = {
            userEmail: email,
            contribution: 0,
            ordersCount: 0
          };
        }
        
        contributions[email].contribution += savings;
        contributions[email].ordersCount += 1;
      }
    });

    // Sort and limit
    return Object.values(contributions)
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, limit);
  });
}

/**
 * Get savings by region
 */
export async function getSavingsByRegion() {
  return await apiCall(async () => {
    // Try to use the RPC function first
    const { data, error: rpcError } = await supabaseClient
      .rpc('get_savings_by_region');

    if (!rpcError && data) {
      return data.map(item => ({
        region: item.region,
        totalSavings: parseFloat(item.total_savings) || 0,
        ordersCount: parseInt(item.orders_count) || 0
      }));
    }

    // Fallback to manual calculation
    const { data: orders, error } = await supabaseClient
      .from('orders')
      .select(`
        total_price,
        product_id,
        products!inner (
          region,
          current_quantity,
          target_quantity
        )
      `)
      .eq('fulfillment_status', 'completed');

    if (error) {
      throw error;
    }

    // Group by region and calculate savings
    const regionSavings = {};
    
    (orders || []).forEach(order => {
      const product = order.products;
      if (product && 
          product.current_quantity >= product.target_quantity && 
          product.target_quantity > 0) {
        const region = product.region || 'Unknown';
        const savings = (parseFloat(order.total_price) || 0) * 0.15;
        
        if (!regionSavings[region]) {
          regionSavings[region] = {
            region,
            totalSavings: 0,
            ordersCount: 0
          };
        }
        
        regionSavings[region].totalSavings += savings;
        regionSavings[region].ordersCount += 1;
      }
    });

    // Sort by total savings
    return Object.values(regionSavings)
      .sort((a, b) => b.totalSavings - a.totalSavings);
  });
}

/**
 * Get community stats summary (from view if available)
 */
export async function getCommunityStatsSummary() {
  return await apiCall(async () => {
    // Try to query the view
    const { data, error: viewError } = await supabaseClient
      .from('community_stats_view')
      .select('*')
      .single();

    if (!viewError && data) {
      return {
        totalParticipants: parseInt(data.total_participants) || 0,
        completedGroupBuys: parseInt(data.completed_group_buys) || 0,
        totalSpent: parseFloat(data.total_spent) || 0,
        totalSavings: parseFloat(data.total_savings) || 0,
        avgSavingsPerOrder: parseFloat(data.avg_savings_per_order) || 0
      };
    }

    // Fallback: calculate manually
    const totalSavings = await getCommunitySavings();
    const topContributors = await getTopContributors(10);
    
    return {
      totalParticipants: topContributors.length,
      completedGroupBuys: 0, // Would need additional query
      totalSpent: 0, // Would need additional calculation
      totalSavings,
      avgSavingsPerOrder: 0
    };
  });
}

