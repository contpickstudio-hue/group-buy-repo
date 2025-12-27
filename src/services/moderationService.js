/**
 * Moderation Service
 * Handles admin moderation actions (suspensions, etc.)
 */

import { supabaseClient } from './supabaseService';
import { apiCall } from './errorService';
import { setStorageItem, getStorageItem } from '../utils/storageUtils';

const StorageKeys = {
  userSuspensions: 'userSuspensions',
  listingSuspensions: 'listingSuspensions',
  errandSuspensions: 'errandSuspensions'
};

/**
 * Suspend a user
 * @param {string} userEmail - Email of user to suspend
 * @param {string} reason - Reason for suspension
 * @param {string} suspensionType - 'warning', 'temporary', or 'permanent'
 * @param {string} adminEmail - Admin email
 * @param {Date} suspendedUntil - End date for temporary suspension (optional)
 * @param {string} adminNotes - Admin notes (optional)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function suspendUser(userEmail, reason, suspensionType, adminEmail, suspendedUntil = null, adminNotes = null) {
  return await apiCall(async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
      // Demo user - store in localStorage
      const suspensions = await getStorageItem(StorageKeys.userSuspensions, []);
      const newSuspension = {
        id: Date.now(),
        user_email: userEmail,
        reason,
        suspension_type: suspensionType,
        suspended_until: suspendedUntil ? suspendedUntil.toISOString() : null,
        suspended_by: adminEmail,
        admin_notes: adminNotes,
        is_active: true,
        created_at: new Date().toISOString()
      };
      suspensions.push(newSuspension);
      await setStorageItem(StorageKeys.userSuspensions, suspensions);
      return { success: true };
    }

    const { data, error } = await supabaseClient.rpc('suspend_user', {
      p_user_email: userEmail,
      p_reason: reason,
      p_suspension_type: suspensionType,
      p_suspended_until: suspendedUntil ? suspendedUntil.toISOString() : null,
      p_suspended_by: adminEmail,
      p_admin_notes: adminNotes
    });

    if (error) {
      throw new Error(error.message || 'Failed to suspend user');
    }

    if (!data || data.length === 0 || !data[0].success) {
      throw new Error(data?.[0]?.error_message || 'Failed to suspend user');
    }

    return { success: true };
  });
}

/**
 * Suspend a listing
 * @param {number} listingId - Listing ID
 * @param {string} reason - Reason for suspension
 * @param {string} adminEmail - Admin email
 * @param {string} adminNotes - Admin notes (optional)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function suspendListing(listingId, reason, adminEmail, adminNotes = null) {
  return await apiCall(async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
      // Demo user - store in localStorage
      const suspensions = await getStorageItem(StorageKeys.listingSuspensions, []);
      const newSuspension = {
        id: Date.now(),
        listing_id: listingId,
        reason,
        suspended_by: adminEmail,
        admin_notes: adminNotes,
        is_active: true,
        created_at: new Date().toISOString()
      };
      suspensions.push(newSuspension);
      await setStorageItem(StorageKeys.listingSuspensions, suspensions);
      return { success: true };
    }

    const { data, error } = await supabaseClient.rpc('suspend_listing', {
      p_listing_id: listingId,
      p_reason: reason,
      p_suspended_by: adminEmail,
      p_admin_notes: adminNotes
    });

    if (error) {
      throw new Error(error.message || 'Failed to suspend listing');
    }

    if (!data || data.length === 0 || !data[0].success) {
      throw new Error(data?.[0]?.error_message || 'Failed to suspend listing');
    }

    return { success: true };
  });
}

/**
 * Suspend an errand
 * @param {number} errandId - Errand ID
 * @param {string} reason - Reason for suspension
 * @param {string} adminEmail - Admin email
 * @param {string} adminNotes - Admin notes (optional)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function suspendErrand(errandId, reason, adminEmail, adminNotes = null) {
  return await apiCall(async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
      // Demo user - store in localStorage
      const suspensions = await getStorageItem(StorageKeys.errandSuspensions, []);
      const newSuspension = {
        id: Date.now(),
        errand_id: errandId,
        reason,
        suspended_by: adminEmail,
        admin_notes: adminNotes,
        is_active: true,
        created_at: new Date().toISOString()
      };
      suspensions.push(newSuspension);
      await setStorageItem(StorageKeys.errandSuspensions, suspensions);
      return { success: true };
    }

    const { data, error } = await supabaseClient.rpc('suspend_errand', {
      p_errand_id: errandId,
      p_reason: reason,
      p_suspended_by: adminEmail,
      p_admin_notes: adminNotes
    });

    if (error) {
      throw new Error(error.message || 'Failed to suspend errand');
    }

    if (!data || data.length === 0 || !data[0].success) {
      throw new Error(data?.[0]?.error_message || 'Failed to suspend errand');
    }

    return { success: true };
  });
}

/**
 * Check if user is suspended
 * @param {string} userEmail - User email
 * @returns {Promise<{success: boolean, isSuspended?: boolean, suspension?: Object, error?: string}>}
 */
export async function checkUserSuspension(userEmail) {
  return await apiCall(async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
      // Check localStorage
      const suspensions = await getStorageItem(StorageKeys.userSuspensions, []);
      const activeSuspension = suspensions.find(s => 
        s.user_email === userEmail &&
        s.is_active &&
        (s.suspension_type === 'permanent' || 
         (s.suspension_type === 'temporary' && (!s.suspended_until || new Date(s.suspended_until) > new Date())))
      );
      return { 
        success: true, 
        isSuspended: !!activeSuspension,
        suspension: activeSuspension || null
      };
    }

    const { data, error } = await supabaseClient.rpc('is_user_suspended', {
      p_user_email: userEmail
    });

    if (error) {
      throw new Error(error.message || 'Failed to check suspension');
    }

    // Get suspension details if suspended
    let suspension = null;
    if (data) {
      const { data: suspensionData } = await supabaseClient
        .from('user_suspensions')
        .select('*')
        .eq('user_email', userEmail)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      suspension = suspensionData;
    }

    return { success: true, isSuspended: data || false, suspension };
  });
}

/**
 * Check if listing is suspended
 * @param {number} listingId - Listing ID
 * @returns {Promise<{success: boolean, isSuspended?: boolean, suspension?: Object, error?: string}>}
 */
export async function checkListingSuspension(listingId) {
  return await apiCall(async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
      // Check localStorage
      const suspensions = await getStorageItem(StorageKeys.listingSuspensions, []);
      const activeSuspension = suspensions.find(s => 
        s.listing_id === listingId && s.is_active
      );
      return { 
        success: true, 
        isSuspended: !!activeSuspension,
        suspension: activeSuspension || null
      };
    }

    const { data, error } = await supabaseClient.rpc('is_listing_suspended', {
      p_listing_id: listingId
    });

    if (error) {
      throw new Error(error.message || 'Failed to check suspension');
    }

    // Get suspension details if suspended
    let suspension = null;
    if (data) {
      const { data: suspensionData } = await supabaseClient
        .from('listing_suspensions')
        .select('*')
        .eq('listing_id', listingId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      suspension = suspensionData;
    }

    return { success: true, isSuspended: data || false, suspension };
  });
}

/**
 * Check if errand is suspended
 * @param {number} errandId - Errand ID
 * @returns {Promise<{success: boolean, isSuspended?: boolean, suspension?: Object, error?: string}>}
 */
export async function checkErrandSuspension(errandId) {
  return await apiCall(async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
      // Check localStorage
      const suspensions = await getStorageItem(StorageKeys.errandSuspensions, []);
      const activeSuspension = suspensions.find(s => 
        s.errand_id === errandId && s.is_active
      );
      return { 
        success: true, 
        isSuspended: !!activeSuspension,
        suspension: activeSuspension || null
      };
    }

    const { data, error } = await supabaseClient.rpc('is_errand_suspended', {
      p_errand_id: errandId
    });

    if (error) {
      throw new Error(error.message || 'Failed to check suspension');
    }

    // Get suspension details if suspended
    let suspension = null;
    if (data) {
      const { data: suspensionData } = await supabaseClient
        .from('errand_suspensions')
        .select('*')
        .eq('errand_id', errandId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      suspension = suspensionData;
    }

    return { success: true, isSuspended: data || false, suspension };
  });
}

/**
 * Get all active suspensions
 * @param {string} adminEmail - Admin email
 * @returns {Promise<{success: boolean, suspensions?: Object, error?: string}>}
 */
export async function getAllActiveSuspensions(adminEmail) {
  return await apiCall(async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
      // Return from localStorage
      const userSuspensions = await getStorageItem(StorageKeys.userSuspensions, []);
      const listingSuspensions = await getStorageItem(StorageKeys.listingSuspensions, []);
      const errandSuspensions = await getStorageItem(StorageKeys.errandSuspensions, []);
      
      return {
        success: true,
        suspensions: {
          users: userSuspensions.filter(s => s.is_active),
          listings: listingSuspensions.filter(s => s.is_active),
          errands: errandSuspensions.filter(s => s.is_active)
        }
      };
    }

    const [userResult, listingResult, errandResult] = await Promise.all([
      supabaseClient.from('user_suspensions').select('*').eq('is_active', true),
      supabaseClient.from('listing_suspensions').select('*').eq('is_active', true),
      supabaseClient.from('errand_suspensions').select('*').eq('is_active', true)
    ]);

    if (userResult.error || listingResult.error || errandResult.error) {
      throw new Error('Failed to load suspensions');
    }

    return {
      success: true,
      suspensions: {
        users: userResult.data || [],
        listings: listingResult.data || [],
        errands: errandResult.data || []
      }
    };
  });
}

