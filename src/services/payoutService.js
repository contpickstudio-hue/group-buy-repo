/**
 * Payout Service
 * Manages vendor payout methods and withdrawal requests
 */

import { supabaseClient } from './supabaseService';
import { apiCall } from './errorService';
import { dbSaveSlice, dbLoadSlice, StorageKeys } from './supabaseService';

const MINIMUM_WITHDRAWAL_AMOUNT = 50.00; // Minimum threshold for withdrawals

/**
 * Get payout methods for a vendor
 */
export async function getPayoutMethods(vendorEmail) {
  return await apiCall(async () => {
    if (!supabaseClient) {
      // For demo mode, load from localStorage
      const storedMethods = await dbLoadSlice(StorageKeys.payoutMethods, []);
      const vendorMethods = storedMethods.filter(m => m.vendorEmail === vendorEmail);
      return {
        success: true,
        methods: vendorMethods.map(m => ({
          id: m.id,
          vendorEmail: m.vendorEmail,
          methodType: m.methodType,
          methodName: m.methodName,
          isDefault: m.isDefault,
          bankName: m.bankName,
          accountNumberMasked: m.accountNumberMasked,
          accountHolderName: m.accountHolderName,
          isVerified: m.isVerified
        }))
      };
    }

    const { data, error } = await supabaseClient
      .from('payout_methods')
      .select('*')
      .eq('vendor_email', vendorEmail)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return {
      success: true,
      methods: (data || []).map(m => ({
        id: m.id,
        vendorEmail: m.vendor_email,
        methodType: m.method_type,
        methodName: m.method_name,
        isDefault: m.is_default,
        bankName: m.bank_name,
        accountNumberMasked: m.account_number_masked,
        routingNumber: m.routing_number, // Should be encrypted in production
        accountHolderName: m.account_holder_name,
        stripeAccountId: m.stripe_account_id,
        isVerified: m.is_verified
      }))
    };
  }, {
    context: 'Getting payout methods',
    showToast: false
  });
}

/**
 * Add payout method
 */
export async function addPayoutMethod(vendorEmail, methodData) {
  return await apiCall(async () => {
    if (!supabaseClient) {
      // For demo mode, save to localStorage
      const storedMethods = await dbLoadSlice(StorageKeys.payoutMethods, []);
      const newMethod = {
        id: Date.now(),
        vendorEmail,
        methodType: methodData.methodType,
        methodName: methodData.methodName,
        isDefault: methodData.isDefault || false,
        bankName: methodData.bankName,
        accountNumberMasked: methodData.accountNumber ? `****${methodData.accountNumber.slice(-4)}` : null,
        accountHolderName: methodData.accountHolderName,
        isVerified: false,
        createdAt: new Date().toISOString()
      };
      
      // If this is default, unset other defaults
      if (newMethod.isDefault) {
        storedMethods.forEach(m => {
          if (m.vendorEmail === vendorEmail) {
            m.isDefault = false;
          }
        });
      }
      
      storedMethods.push(newMethod);
      await dbSaveSlice(StorageKeys.payoutMethods, storedMethods);
      
      return { success: true, method: newMethod };
    }

    // If this is default, unset other defaults first
    if (methodData.isDefault) {
      await supabaseClient
        .from('payout_methods')
        .update({ is_default: false })
        .eq('vendor_email', vendorEmail)
        .eq('is_default', true);
    }

    const { data, error } = await supabaseClient
      .from('payout_methods')
      .insert({
        vendor_email: vendorEmail,
        method_type: methodData.methodType,
        method_name: methodData.methodName,
        is_default: methodData.isDefault || false,
        bank_name: methodData.bankName || null,
        account_number_masked: methodData.accountNumber ? `****${methodData.accountNumber.slice(-4)}` : null,
        routing_number: methodData.routingNumber || null, // Should be encrypted in production
        account_holder_name: methodData.accountHolderName || null,
        stripe_account_id: methodData.stripeAccountId || null,
        is_verified: false
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      method: {
        id: data.id,
        vendorEmail: data.vendor_email,
        methodType: data.method_type,
        methodName: data.method_name,
        isDefault: data.is_default,
        bankName: data.bank_name,
        accountNumberMasked: data.account_number_masked,
        accountHolderName: data.account_holder_name,
        isVerified: data.is_verified
      }
    };
  }, {
    context: 'Adding payout method',
    showToast: true
  });
}

/**
 * Delete payout method
 */
export async function deletePayoutMethod(methodId) {
  return await apiCall(async () => {
    if (!supabaseClient) {
      const storedMethods = await dbLoadSlice(StorageKeys.payoutMethods, []);
      const filtered = storedMethods.filter(m => m.id !== methodId);
      await dbSaveSlice(StorageKeys.payoutMethods, filtered);
      return { success: true };
    }

    const { error } = await supabaseClient
      .from('payout_methods')
      .delete()
      .eq('id', methodId);

    if (error) {
      throw error;
    }

    return { success: true };
  }, {
    context: 'Deleting payout method',
    showToast: true
  });
}

/**
 * Set default payout method
 */
export async function setDefaultPayoutMethod(vendorEmail, methodId) {
  return await apiCall(async () => {
    if (!supabaseClient) {
      const storedMethods = await dbLoadSlice(StorageKeys.payoutMethods, []);
      storedMethods.forEach(m => {
        if (m.vendorEmail === vendorEmail) {
          m.isDefault = m.id === methodId;
        }
      });
      await dbSaveSlice(StorageKeys.payoutMethods, storedMethods);
      return { success: true };
    }

    // Unset all defaults first
    await supabaseClient
      .from('payout_methods')
      .update({ is_default: false })
      .eq('vendor_email', vendorEmail);

    // Set new default
    const { error } = await supabaseClient
      .from('payout_methods')
      .update({ is_default: true })
      .eq('id', methodId)
      .eq('vendor_email', vendorEmail);

    if (error) {
      throw error;
    }

    return { success: true };
  }, {
    context: 'Setting default payout method',
    showToast: true
  });
}

/**
 * Create withdrawal request
 */
export async function createWithdrawalRequest(vendorEmail, amount, payoutMethodId) {
  return await apiCall(async () => {
    // Validate minimum threshold
    if (amount < MINIMUM_WITHDRAWAL_AMOUNT) {
      return {
        success: false,
        error: `Minimum withdrawal amount is $${MINIMUM_WITHDRAWAL_AMOUNT.toFixed(2)}`
      };
    }

    // Get vendor wallet to check available balance
    const { getVendorWallet } = await import('./walletService');
    const walletResult = await getVendorWallet(vendorEmail);
    
    if (!walletResult.success) {
      return { success: false, error: 'Failed to get wallet balance' };
    }

    const availableBalance = walletResult.wallet.availableBalance || 0;
    
    if (amount > availableBalance) {
      return {
        success: false,
        error: `Insufficient balance. Available: $${availableBalance.toFixed(2)}`
      };
    }

    // Calculate fee (placeholder - no fees for now)
    const fee = 0;
    const netAmount = amount - fee;

    if (!supabaseClient) {
      // For demo mode, save to localStorage
      const storedRequests = await dbLoadSlice(StorageKeys.withdrawalRequests, []);
      const newRequest = {
        id: Date.now(),
        vendorEmail,
        payoutMethodId,
        amount,
        status: 'pending',
        minimumThreshold: MINIMUM_WITHDRAWAL_AMOUNT,
        fee,
        netAmount,
        requestedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      
      storedRequests.push(newRequest);
      await dbSaveSlice(StorageKeys.withdrawalRequests, storedRequests);
      
      return { success: true, request: newRequest };
    }

    const { data, error } = await supabaseClient
      .from('withdrawal_requests')
      .insert({
        vendor_email: vendorEmail,
        payout_method_id: payoutMethodId,
        amount,
        status: 'pending',
        minimum_threshold: MINIMUM_WITHDRAWAL_AMOUNT,
        fee,
        net_amount: netAmount
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      request: {
        id: data.id,
        vendorEmail: data.vendor_email,
        payoutMethodId: data.payout_method_id,
        amount: parseFloat(data.amount),
        status: data.status,
        fee: parseFloat(data.fee || 0),
        netAmount: parseFloat(data.net_amount || 0),
        requestedAt: data.requested_at
      }
    };
  }, {
    context: 'Creating withdrawal request',
    showToast: true
  });
}

/**
 * Get withdrawal requests for a vendor
 */
export async function getWithdrawalRequests(vendorEmail) {
  return await apiCall(async () => {
    if (!supabaseClient) {
      const storedRequests = await dbLoadSlice(StorageKeys.withdrawalRequests, []);
      const vendorRequests = storedRequests.filter(r => r.vendorEmail === vendorEmail);
      return {
        success: true,
        requests: vendorRequests.sort((a, b) => 
          new Date(b.requestedAt || b.createdAt) - new Date(a.requestedAt || a.createdAt)
        )
      };
    }

    const { data, error } = await supabaseClient
      .from('withdrawal_requests')
      .select('*')
      .eq('vendor_email', vendorEmail)
      .order('requested_at', { ascending: false });

    if (error) {
      throw error;
    }

    return {
      success: true,
      requests: (data || []).map(r => ({
        id: r.id,
        vendorEmail: r.vendor_email,
        payoutMethodId: r.payout_method_id,
        amount: parseFloat(r.amount),
        status: r.status,
        fee: parseFloat(r.fee || 0),
        netAmount: parseFloat(r.net_amount || 0),
        requestedAt: r.requested_at,
        processedAt: r.processed_at
      }))
    };
  }, {
    context: 'Getting withdrawal requests',
    showToast: false
  });
}

/**
 * Get minimum withdrawal amount
 */
export function getMinimumWithdrawalAmount() {
  return MINIMUM_WITHDRAWAL_AMOUNT;
}

