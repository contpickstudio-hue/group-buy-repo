import { supabaseClient } from './supabaseService';
import { apiCall } from './errorService';

/**
 * Credits Service
 * Handles user credit management, application, and history
 */

// Credit expiration days (default 90 days)
const CREDIT_EXPIRATION_DAYS = 90;

/**
 * Add credits to a user account
 */
export async function addCredits(userEmail, amount, source, referralId = null) {
  return await apiCall(async () => {
    if (!userEmail || !amount || amount <= 0) {
      throw new Error('Valid user email and amount are required');
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + CREDIT_EXPIRATION_DAYS);

    const { data, error } = await supabaseClient
      .from('user_credits')
      .insert({
        user_email: userEmail,
        amount: parseFloat(amount),
        source: source || 'bonus',
        referral_id: referralId,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, credit: data };
  });
}

/**
 * Get user's total credit balance (unused, non-expired credits)
 */
export async function getUserCredits(userEmail) {
  return await apiCall(async () => {
    if (!userEmail) {
      return { balance: 0, credits: [] };
    }

    // Try to use the RPC function first
    const { data: balance, error: rpcError } = await supabaseClient
      .rpc('get_user_credit_balance', { user_email_param: userEmail });

    if (!rpcError && balance !== null) {
      // Also get individual credit records
      const { data: credits } = await supabaseClient
        .from('user_credits')
        .select('*')
        .eq('user_email', userEmail)
        .is('used_at', null)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false });

      return {
        balance: parseFloat(balance) || 0,
        credits: credits || []
      };
    }

    // Fallback to manual calculation
    const { data: credits, error } = await supabaseClient
      .from('user_credits')
      .select('*')
      .eq('user_email', userEmail)
      .is('used_at', null)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (error) {
      throw error;
    }

    const balance = (credits || []).reduce((sum, credit) => {
      return sum + (parseFloat(credit.amount) || 0);
    }, 0);

    return {
      balance,
      credits: credits || []
    };
  });
}

/**
 * Apply credits to an order
 */
export async function applyCreditsToOrder(userEmail, orderId, amount) {
  return await apiCall(async () => {
    if (!userEmail || !orderId || !amount || amount <= 0) {
      throw new Error('User email, order ID, and valid amount are required');
    }

    // Get available credits (oldest first to use expiring credits first)
    const { data: availableCredits, error: fetchError } = await supabaseClient
      .from('user_credits')
      .select('*')
      .eq('user_email', userEmail)
      .is('used_at', null)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('expires_at', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    let remainingAmount = parseFloat(amount);
    const creditsToUse = [];

    // Use credits until we've covered the amount
    // Store full credit records to preserve source and referral_id
    for (const credit of availableCredits || []) {
      if (remainingAmount <= 0) break;

      const creditAmount = parseFloat(credit.amount);
      const useAmount = Math.min(creditAmount, remainingAmount);

      creditsToUse.push({
        id: credit.id,
        useAmount,
        originalAmount: creditAmount,
        source: credit.source,
        referral_id: credit.referral_id
      });

      remainingAmount -= useAmount;
    }

    // If we don't have enough credits, return error
    if (remainingAmount > 0) {
      throw new Error('Insufficient credits');
    }

    // Mark credits as used
    for (const creditUsage of creditsToUse) {
      const { error: updateError } = await supabaseClient
        .from('user_credits')
        .update({
          used_at: new Date().toISOString(),
          order_id: orderId
        })
        .eq('id', creditUsage.id);

      if (updateError) {
        throw updateError;
      }

      // If partial usage, create a new credit record for the remainder
      if (creditUsage.useAmount < creditUsage.originalAmount) {
        const remainder = creditUsage.originalAmount - creditUsage.useAmount;
        await addCredits(userEmail, remainder, creditUsage.source || 'bonus', creditUsage.referral_id);
      }
    }

    return { success: true, creditsUsed: parseFloat(amount) - remainingAmount };
  });
}

/**
 * Get credit history for a user
 */
export async function getCreditsHistory(userEmail, limit = 50) {
  return await apiCall(async () => {
    const { data, error } = await supabaseClient
      .from('user_credits')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data || [];
  });
}

