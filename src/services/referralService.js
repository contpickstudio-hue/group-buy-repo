import { supabaseClient } from './supabaseService';
import { apiCall } from './errorService';

/**
 * Referral Service
 * Handles referral code generation, tracking, and reward processing
 */

// Referral credit amounts (configurable)
const REFERRER_CREDIT_AMOUNT = 5.00; // $5 credit to referrer when referee makes first order
const REFEREE_CREDIT_AMOUNT = 3.00; // $3 credit to referee on first order

/**
 * Generate a unique referral code for a user
 * Format: First 3 chars of email + random 6 char alphanumeric
 */
export async function generateReferralCode(userEmail) {
  return await apiCall(async () => {
    if (!userEmail) {
      throw new Error('User email is required');
    }

    // Generate base code from email (first 3 characters, uppercase, alphanumeric only)
    const emailPrefix = userEmail
      .split('@')[0]
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .padEnd(3, 'X');

    // Generate random suffix
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const referralCode = `${emailPrefix}${randomSuffix}`;

    // Check if code already exists (very unlikely, but check anyway)
    const { data: existing } = await supabaseClient
      .from('referrals')
      .select('referral_code')
      .eq('referral_code', referralCode)
      .single();

    if (existing) {
      // If collision, generate again with different random suffix
      const newSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `${emailPrefix}${newSuffix}`;
    }

    return referralCode;
  });
}

/**
 * Get or create a referral code for a user
 */
export async function getUserReferralCode(userEmail) {
  return await apiCall(async () => {
    // Check if user already has a referral code (any referral where they are the referrer)
    const { data: existing, error: selectError } = await supabaseClient
      .from('referrals')
      .select('referral_code')
      .eq('referrer_email', userEmail)
      .limit(1)
      .single();

    if (existing && existing.referral_code) {
      return existing.referral_code;
    }

    // Generate new referral code
    const code = await generateReferralCode(userEmail);
    
    // Create a placeholder referral record to store the code
    // This ensures the code is reserved for this user
    const { error: insertError } = await supabaseClient
      .from('referrals')
      .insert({
        referrer_email: userEmail,
        referral_code: code,
        status: 'pending'
      });

    if (insertError && !insertError.message.includes('duplicate')) {
      throw insertError;
    }

    return code;
  });
}

/**
 * Create a referral link (for sharing)
 */
export function createReferralLink(referralCode, productId = null) {
  const baseUrl = window.location.origin;
  if (productId) {
    return `${baseUrl}/#/groupbuy/${productId}?ref=${referralCode}`;
  }
  return `${baseUrl}/#/signup?ref=${referralCode}`;
}

/**
 * Process referral signup - when a new user signs up with a referral code
 */
export async function processReferralSignup(referralCode, newUserEmail) {
  return await apiCall(async () => {
    if (!referralCode || !newUserEmail) {
      return { success: false, error: 'Referral code and user email are required' };
    }

    // Find the referral by code
    const { data: referral, error: findError } = await supabaseClient
      .from('referrals')
      .select('*')
      .eq('referral_code', referralCode)
      .eq('status', 'pending')
      .single();

    if (findError || !referral) {
      return { success: false, error: 'Invalid or already used referral code' };
    }

    // Update referral status to 'joined'
    const { error: updateError } = await supabaseClient
      .from('referrals')
      .update({
        referred_email: newUserEmail,
        status: 'joined',
        joined_at: new Date().toISOString()
      })
      .eq('id', referral.id);

    if (updateError) {
      throw updateError;
    }

    return { success: true, referralId: referral.id };
  });
}

/**
 * Process referral order - when a referred user makes their first order
 */
export async function processReferralOrder(referredUserEmail, orderId) {
  return await apiCall(async () => {
    if (!referredUserEmail) {
      return { success: false, error: 'User email is required' };
    }

    // Find referral where this user was referred and status is 'joined' (not yet rewarded)
    const { data: referral, error: findError } = await supabaseClient
      .from('referrals')
      .select('*')
      .eq('referred_email', referredUserEmail)
      .eq('status', 'joined')
      .single();

    if (findError || !referral) {
      // No pending referral for this user
      return { success: false, error: 'No pending referral found' };
    }

    // Import credits service dynamically (avoid circular dependency)
    const creditsModule = await import('./creditsService');
    const { addCredits } = creditsModule;

    // Issue credits to referrer
    await addCredits(
      referral.referrer_email,
      REFERRER_CREDIT_AMOUNT,
      'referral',
      referral.id
    );

    // Issue credits to referee (new user)
    await addCredits(
      referredUserEmail,
      REFEREE_CREDIT_AMOUNT,
      'referral',
      referral.id
    );

    // Update referral status to 'rewarded'
    const { error: updateError } = await supabaseClient
      .from('referrals')
      .update({
        status: 'rewarded',
        rewarded_at: new Date().toISOString(),
        credits_issued: REFERRER_CREDIT_AMOUNT,
        credits_issued_to_referee: REFEREE_CREDIT_AMOUNT
      })
      .eq('id', referral.id);

    if (updateError) {
      throw updateError;
    }

    return {
      success: true,
      referralId: referral.id,
      referrerCredits: REFERRER_CREDIT_AMOUNT,
      refereeCredits: REFEREE_CREDIT_AMOUNT
    };
  });
}

/**
 * Get user's referrals
 */
export async function getUserReferrals(userEmail) {
  return await apiCall(async () => {
    const { data, error } = await supabaseClient
      .from('referrals')
      .select('*')
      .eq('referrer_email', userEmail)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  });
}

/**
 * Get referral stats for a user
 */
export async function getReferralStats(userEmail) {
  return await apiCall(async () => {
    const { data, error } = await supabaseClient
      .rpc('get_referral_stats', { user_email_param: userEmail });

    if (error) {
      // Fallback to manual calculation if RPC function doesn't exist
      const referrals = await getUserReferrals(userEmail);
      const totalReferrals = referrals.length;
      const successfulReferrals = referrals.filter(r => r.status === 'rewarded').length;
      const totalCreditsEarned = referrals
        .filter(r => r.status === 'rewarded')
        .reduce((sum, r) => sum + (parseFloat(r.credits_issued) || 0), 0);
      const pendingReferrals = referrals.filter(r => r.status === 'pending' || r.status === 'joined').length;

      return {
        totalReferrals,
        successfulReferrals,
        totalCreditsEarned,
        pendingReferrals
      };
    }

    return data || {
      totalReferrals: 0,
      successfulReferrals: 0,
      totalCreditsEarned: 0,
      pendingReferrals: 0
    };
  });
}

/**
 * Create a product-specific referral
 */
export async function createProductReferral(referrerEmail, productId) {
  return await apiCall(async () => {
    const referralCode = await getUserReferralCode(referrerEmail);
    
    // Check if referral already exists for this product
    const { data: existing } = await supabaseClient
      .from('referrals')
      .select('id')
      .eq('referrer_email', referrerEmail)
      .eq('product_id', productId)
      .single();

    if (existing) {
      return { success: true, referralCode, referralId: existing.id };
    }

    // Create new referral with product_id
    const { data, error } = await supabaseClient
      .from('referrals')
      .insert({
        referrer_email: referrerEmail,
        referral_code: referralCode,
        product_id: productId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, referralCode, referralId: data.id };
  });
}

