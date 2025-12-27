/**
 * Wallet Service
 * Manages vendor wallet balances and calculations
 */

import { supabaseClient } from './supabaseService';
import { apiCall } from './errorService';
import { dbSaveSlice, dbLoadSlice, StorageKeys } from './supabaseService';

/**
 * Get vendor wallet balance
 * Calculates available and pending balances from orders
 */
export async function getVendorWallet(vendorEmail) {
  return await apiCall(async () => {
    if (!supabaseClient) {
      // For demo/offline mode, calculate from localStorage
      return await getVendorWalletFromLocal(vendorEmail);
    }

    // Try to get wallet from database
    const { data: walletData, error: walletError } = await supabaseClient
      .from('vendor_wallets')
      .select('*')
      .eq('vendor_email', vendorEmail)
      .single();

    if (walletError && walletError.code !== 'PGRST116') { // PGRST116 = not found
      throw walletError;
    }

    // Calculate balances from orders if wallet doesn't exist
    const balances = await calculateVendorBalances(vendorEmail);
    
    // If wallet exists, use it; otherwise create one
    if (walletData) {
      return {
        success: true,
        wallet: {
          ...walletData,
          availableBalance: parseFloat(walletData.available_balance || 0),
          pendingBalance: parseFloat(walletData.pending_balance || 0),
          totalEarned: parseFloat(walletData.total_earned || 0),
          totalWithdrawn: parseFloat(walletData.total_withdrawn || 0)
        }
      };
    } else {
      // Create wallet with calculated balances
      const { data: newWallet, error: createError } = await supabaseClient
        .from('vendor_wallets')
        .insert({
          vendor_email: vendorEmail,
          available_balance: balances.available,
          pending_balance: balances.pending,
          total_earned: balances.totalEarned
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      return {
        success: true,
        wallet: {
          ...newWallet,
          availableBalance: parseFloat(newWallet.available_balance || 0),
          pendingBalance: parseFloat(newWallet.pending_balance || 0),
          totalEarned: parseFloat(newWallet.total_earned || 0),
          totalWithdrawn: parseFloat(newWallet.total_withdrawn || 0)
        }
      };
    }
  }, {
    context: 'Getting vendor wallet',
    showToast: false
  });
}

/**
 * Calculate vendor balances from orders
 * Available: Orders from successful batches with escrow released
 * Pending: Orders from active batches with escrow held
 */
async function calculateVendorBalances(vendorEmail) {
  if (!supabaseClient) {
    return { available: 0, pending: 0, totalEarned: 0 };
  }

  // Get vendor's listings
  const { data: listings, error: listingsError } = await supabaseClient
    .from('listings')
    .select('id')
    .eq('owner_email', vendorEmail);

  if (listingsError) {
    throw listingsError;
  }

  const listingIds = (listings || []).map(l => l.id);
  if (listingIds.length === 0) {
    return { available: 0, pending: 0, totalEarned: 0 };
  }

  // Get batches for vendor's listings
  const { data: batches, error: batchesError } = await supabaseClient
    .from('regional_batches')
    .select('id, status')
    .in('listing_id', listingIds);

  if (batchesError) {
    throw batchesError;
  }

  const batchIds = (batches || []).map(b => b.id);
  if (batchIds.length === 0) {
    return { available: 0, pending: 0, totalEarned: 0 };
  }

  // Get orders for these batches
  const { data: orders, error: ordersError } = await supabaseClient
    .from('orders')
    .select('total_price, escrow_status, payment_status, regional_batch_id')
    .in('regional_batch_id', batchIds);

  if (ordersError) {
    throw ordersError;
  }

  // Calculate balances
  let available = 0;
  let pending = 0;
  let totalEarned = 0;

  (orders || []).forEach(order => {
    const amount = parseFloat(order.total_price || 0);
    const escrowStatus = order.escrow_status;
    const paymentStatus = order.payment_status;

    // Available: Escrow released (successful batches)
    if (escrowStatus === 'escrow_released' || paymentStatus === 'paid') {
      available += amount;
      totalEarned += amount;
    }
    // Pending: Escrow held (active batches)
    else if (escrowStatus === 'escrow_held' || paymentStatus === 'authorized') {
      pending += amount;
    }
  });

  return { available, pending, totalEarned };
}

/**
 * Get vendor wallet from local storage (demo mode)
 */
async function getVendorWalletFromLocal(vendorEmail) {
  const storedWallets = await dbLoadSlice(StorageKeys.vendorWallets, []);
  const wallet = storedWallets.find(w => w.vendorEmail === vendorEmail);
  
  if (wallet) {
    return {
      success: true,
      wallet: {
        vendorEmail: wallet.vendorEmail,
        availableBalance: parseFloat(wallet.availableBalance || 0),
        pendingBalance: parseFloat(wallet.pendingBalance || 0),
        totalEarned: parseFloat(wallet.totalEarned || 0),
        totalWithdrawn: parseFloat(wallet.totalWithdrawn || 0)
      }
    };
  }

  // Calculate from local orders
  const { loadOrdersFromBackend } = await import('./supabaseService');
  const orders = await loadOrdersFromBackend();
  
  // Filter vendor orders (simplified for demo)
  const vendorOrders = orders.filter(o => {
    // In demo mode, we'd need to check listings, but for simplicity, return 0
    return false;
  });

  return {
    success: true,
    wallet: {
      vendorEmail,
      availableBalance: 0,
      pendingBalance: 0,
      totalEarned: 0,
      totalWithdrawn: 0
    }
  };
}

/**
 * Update vendor wallet balance
 */
export async function updateVendorWallet(vendorEmail, updates) {
  return await apiCall(async () => {
    if (!supabaseClient) {
      // For demo mode, update localStorage
      const storedWallets = await dbLoadSlice(StorageKeys.vendorWallets, []);
      const index = storedWallets.findIndex(w => w.vendorEmail === vendorEmail);
      
      if (index !== -1) {
        Object.assign(storedWallets[index], updates);
      } else {
        storedWallets.push({ vendorEmail, ...updates });
      }
      
      await dbSaveSlice(StorageKeys.vendorWallets, storedWallets);
      return { success: true };
    }

    const { data, error } = await supabaseClient
      .from('vendor_wallets')
      .update({
        available_balance: updates.availableBalance,
        pending_balance: updates.pendingBalance,
        total_earned: updates.totalEarned,
        total_withdrawn: updates.totalWithdrawn,
        updated_at: new Date().toISOString()
      })
      .eq('vendor_email', vendorEmail)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data };
  }, {
    context: 'Updating vendor wallet',
    showToast: false
  });
}

