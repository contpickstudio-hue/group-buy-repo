/**
 * Errand Service
 * Manages errand lifecycle: applications, acceptance, completion, ratings
 */

import { supabaseClient } from './supabaseService';
import { apiCall } from './errorService';
import { dbSaveSlice, dbLoadSlice, StorageKeys } from './supabaseService';
import { addCredits } from './creditsService';

const MAX_ACTIVE_ERRANDS_PER_HELPER = 3;

/**
 * Apply to an errand as a helper
 */
export async function applyToErrand(errandId, helperEmail, offerAmount = null, message = null) {
  return await apiCall(async () => {
    // Enforce helper role requirement - RBAC check (action level)
    const { useAuthStore } = await import('../stores/authStore');
    const { checkPermission } = await import('../utils/rbacUtils');
    const user = useAuthStore.getState().user;
    const loginMethod = useAuthStore.getState().loginMethod;
    const permissionCheck = checkPermission(user, loginMethod, 'helper');
    if (!permissionCheck.allowed) {
      return { success: false, error: permissionCheck.error };
    }
    if (!supabaseClient) {
      // Demo mode - save to localStorage
      // Check if errand is still open
      const { useAppStore } = await import('../stores');
      const appStore = useAppStore.getState();
      const errand = appStore.errands?.find(e => e.id === errandId);
      
      if (!errand) {
        return { success: false, error: 'Errand not found' };
      }

      if (errand.status !== 'open' || errand.assignedHelperEmail) {
        return { success: false, error: 'This errand is no longer accepting applications' };
      }

      // Check if helper already applied
      const storedApplications = await dbLoadSlice(StorageKeys.applications, []);
      const existingApp = storedApplications.find(a => 
        a.errandId === errandId && a.helperEmail === helperEmail
      );
      
      if (existingApp) {
        return { success: false, error: 'You have already applied to this errand' };
      }

      // Check helper active count
      const activeCount = (appStore.errands || []).filter(e => 
        e.assignedHelperEmail === helperEmail &&
        ['assigned', 'in_progress', 'awaiting_confirmation'].includes(e.status)
      ).length;

      if (activeCount >= MAX_ACTIVE_ERRANDS_PER_HELPER) {
        return {
          success: false,
          error: `You can only have ${MAX_ACTIVE_ERRANDS_PER_HELPER} active errands at a time`
        };
      }

      const newApplication = {
        id: Date.now(),
        errandId,
        helperEmail,
        offerAmount,
        message,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      storedApplications.push(newApplication);
      await dbSaveSlice(StorageKeys.applications, storedApplications);
      
      // Notify requester about new application
      if (errand?.requesterEmail && appStore.addNotification) {
        appStore.addNotification({
          type: 'info',
          title: 'New Errand Application',
          message: `${helperEmail} applied to help with "${errand.title}"`,
          data: { type: 'errand_application', errandId, applicationId: newApplication.id }
        });
      }
      
      return { success: true, application: newApplication };
    }

    // Check if errand is still open and not assigned
    const { data: errandCheck } = await supabaseClient
      .from('errands')
      .select('status, assigned_helper_email')
      .eq('id', errandId)
      .single();

    if (!errandCheck) {
      return { success: false, error: 'Errand not found' };
    }

    if (errandCheck.status !== 'open' || errandCheck.assigned_helper_email) {
      return { success: false, error: 'This errand is no longer accepting applications' };
    }

    // Check if helper already applied
    const { data: existing } = await supabaseClient
      .from('applications')
      .select('id')
      .eq('errand_id', errandId)
      .eq('helper_email', helperEmail)
      .single();

    if (existing) {
      return { success: false, error: 'You have already applied to this errand' };
    }

    // Check helper's active errand count
    const { data: activeErrands } = await supabaseClient
      .from('errands')
      .select('id')
      .eq('assigned_helper_email', helperEmail)
      .in('status', ['assigned', 'in_progress', 'awaiting_confirmation']);

    if (activeErrands && activeErrands.length >= MAX_ACTIVE_ERRANDS_PER_HELPER) {
      return {
        success: false,
        error: `You can only have ${MAX_ACTIVE_ERRANDS_PER_HELPER} active errands at a time`
      };
    }

    // Create application
    const { data, error } = await supabaseClient
      .from('applications')
      .insert({
        errand_id: errandId,
        helper_email: helperEmail,
        offer_amount: offerAmount,
        message: message,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Notify requester about new application
    const { data: errand } = await supabaseClient
      .from('errands')
      .select('requester_email, title')
      .eq('id', errandId)
      .single();

    if (errand?.requester_email) {
      const { createNotification } = await import('../services/notificationService');
      await createNotification(
        errand.requester_email,
        'info',
        `${helperEmail.split('@')[0]} applied to help with "${errand.title}"`,
        'New Errand Application',
        { type: 'errand_application', errandId, applicationId: data.id }
      );
    }

    return {
      success: true,
      application: {
        id: data.id,
        errandId: data.errand_id,
        helperEmail: data.helper_email,
        offerAmount: data.offer_amount ? parseFloat(data.offer_amount) : null,
        message: data.message,
        status: data.status,
        createdAt: data.created_at
      }
    };
  }, {
    context: 'Applying to errand',
    showToast: true
  });
}

/**
 * Accept a helper application (requester action)
 */
export async function acceptHelperApplication(errandId, applicationId, requesterEmail) {
  return await apiCall(async () => {
    if (!supabaseClient) {
      // Demo mode - update localStorage
      const storedApplications = await dbLoadSlice(StorageKeys.applications, []);
      const storedErrands = await dbLoadSlice(StorageKeys.errands, []);
      
      const application = storedApplications.find(a => a.id === applicationId);
      if (!application) {
        return { success: false, error: 'Application not found' };
      }

      // Verify errand is still open
      if (errand.status !== 'open' || errand.assignedHelperEmail) {
        return {
          success: false,
          error: 'This errand is no longer accepting applications'
        };
      }

      // Check helper active count (excluding current errand)
      const activeCount = storedErrands.filter(e => 
        e.assignedHelperEmail === application.helperEmail &&
        e.id !== errandId &&
        ['assigned', 'in_progress', 'awaiting_confirmation'].includes(e.status)
      ).length;

      if (activeCount >= MAX_ACTIVE_ERRANDS_PER_HELPER) {
        return {
          success: false,
          error: `Helper already has ${MAX_ACTIVE_ERRANDS_PER_HELPER} active errands`
        };
      }

      // Accept application
      application.status = 'accepted';
      storedApplications.forEach(a => {
        if (a.errandId === errandId && a.id !== applicationId) {
          a.status = 'rejected';
        }
      });

      // Update errand (already retrieved above)
      if (errand) {
        errand.assignedHelperEmail = application.helperEmail;
        errand.status = 'assigned';
        
        // Notify helper about acceptance
        const { createNotification } = await import('../services/notificationService');
        await createNotification(
          application.helperEmail,
          'success',
          `Your application for "${errand.title}" was accepted! The errand is now assigned to you.`,
          'Application Accepted!',
          { type: 'errand_accepted', errandId }
        );
      }

      await dbSaveSlice(StorageKeys.applications, storedApplications);
      await dbSaveSlice(StorageKeys.errands, storedErrands);

      return { success: true };
    }

    // Use RPC function if available
    const { error } = await supabaseClient.rpc('accept_helper_application', {
      p_errand_id: errandId,
      p_application_id: applicationId,
      p_requester_email: requesterEmail
    });

    if (error) {
      // Fallback to manual update if RPC doesn't exist
      const { data: application } = await supabaseClient
        .from('applications')
        .select('helper_email')
        .eq('id', applicationId)
        .eq('errand_id', errandId)
        .single();

      if (!application) {
        throw new Error('Application not found');
      }

      // Verify errand is still open
      const { data: errandCheck } = await supabaseClient
        .from('errands')
        .select('status, assigned_helper_email')
        .eq('id', errandId)
        .single();

      if (!errandCheck) {
        throw new Error('Errand not found');
      }

      if (errandCheck.status !== 'open' || errandCheck.assigned_helper_email) {
        throw new Error('This errand is no longer accepting applications');
      }

      // Check helper active count (excluding current errand)
      const { data: activeErrands } = await supabaseClient
        .from('errands')
        .select('id')
        .eq('assigned_helper_email', application.helper_email)
        .neq('id', errandId)
        .in('status', ['assigned', 'in_progress', 'awaiting_confirmation']);

      if (activeErrands && activeErrands.length >= MAX_ACTIVE_ERRANDS_PER_HELPER) {
        throw new Error(`Helper already has ${MAX_ACTIVE_ERRANDS_PER_HELPER} active errands`);
      }

      // Accept application
      await supabaseClient
        .from('applications')
        .update({ status: 'accepted' })
        .eq('id', applicationId);

      // Reject others
      await supabaseClient
        .from('applications')
        .update({ status: 'rejected' })
        .eq('errand_id', errandId)
        .neq('id', applicationId);

      // Update errand
      await supabaseClient
        .from('errands')
        .update({
          assigned_helper_email: application.helper_email,
          status: 'assigned'
        })
        .eq('id', errandId);
      
      // Notify helper about acceptance
      const { data: errand } = await supabaseClient
        .from('errands')
        .select('title')
        .eq('id', errandId)
        .single();
      
      if (errand && application.helper_email) {
        const { createNotification } = await import('../services/notificationService');
        await createNotification(
          application.helper_email,
          'success',
          `Your application for "${errand.title}" was accepted! The errand is now assigned to you.`,
          'Application Accepted!',
          { type: 'errand_accepted', errandId }
        );
      }
    }

    return { success: true };
  }, {
    context: 'Accepting helper application',
    showToast: true
  });
}

/**
 * Confirm errand completion (requester or helper)
 */
export async function confirmErrandCompletion(errandId, userEmail, isRequester) {
  return await apiCall(async () => {
    if (!supabaseClient) {
      // Demo mode - update localStorage
      const storedErrands = await dbLoadSlice(StorageKeys.errands, []);
      const errand = storedErrands.find(e => e.id === errandId);
      
      if (!errand) {
        return { success: false, error: 'Errand not found' };
      }

      if (isRequester) {
        errand.requesterConfirmedCompletion = true;
      } else {
        errand.helperConfirmedCompletion = true;
      }

      // Check if both confirmed
      if (errand.requesterConfirmedCompletion && errand.helperConfirmedCompletion) {
        errand.status = 'completed';
        errand.completedAt = new Date().toISOString();
        // Payment release handled separately
        
        // Notify both parties about completion
        const { createNotification } = await import('../services/notificationService');
        if (errand.requesterEmail) {
          await createNotification(
            errand.requesterEmail,
            'success',
            `"${errand.title}" has been completed! You can now rate the helper.`,
            'Errand Completed!',
            { type: 'errand_completed', errandId }
          );
        }
        if (errand.assignedHelperEmail) {
          await createNotification(
            errand.assignedHelperEmail,
            'success',
            `"${errand.title}" has been completed! Payment will be released to your account.`,
            'Errand Completed!',
            { type: 'errand_completed', errandId }
          );
        }
      } else {
        errand.status = 'awaiting_confirmation';
      }

      await dbSaveSlice(StorageKeys.errands, storedErrands);
      return { success: true, bothConfirmed: errand.status === 'completed' };
    }

    // Use RPC function if available
    const { error } = await supabaseClient.rpc('confirm_errand_completion', {
      p_errand_id: errandId,
      p_user_email: userEmail,
      p_is_requester: isRequester
    });

    if (error) {
      // Fallback to manual update
      const { data: errand } = await supabaseClient
        .from('errands')
        .select('*')
        .eq('id', errandId)
        .single();

      if (!errand) {
        throw new Error('Errand not found');
      }

      const updates = {};
      if (isRequester) {
        updates.requester_confirmed_completion = true;
      } else {
        updates.helper_confirmed_completion = true;
      }

      await supabaseClient
        .from('errands')
        .update(updates)
        .eq('id', errandId);

      // Check if both confirmed
      const { data: updatedErrand } = await supabaseClient
        .from('errands')
        .select('requester_confirmed_completion, helper_confirmed_completion')
        .eq('id', errandId)
        .single();

      if (updatedErrand.requester_confirmed_completion && updatedErrand.helper_confirmed_completion) {
        await supabaseClient
          .from('errands')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', errandId);
      } else {
        await supabaseClient
          .from('errands')
          .update({ status: 'awaiting_confirmation' })
          .eq('id', errandId);
      }
    }

    // Check if both confirmed for return value
    const { data: finalErrand } = await supabaseClient
      .from('errands')
      .select('requester_confirmed_completion, helper_confirmed_completion, status, payment_released')
      .eq('id', errandId)
      .single();

    const bothConfirmed = finalErrand.status === 'completed';
    
    // Release payment if both confirmed and not already released
    if (bothConfirmed && !finalErrand.payment_released) {
      // Release payment asynchronously (don't wait)
      releaseErrandPayment(errandId).catch(err => {
        if (import.meta.env.DEV) {
          console.error('Failed to release payment:', err);
        }
      });
      
      // Notify both parties about completion
      const { data: errand } = await supabaseClient
        .from('errands')
        .select('title, requester_email, assigned_helper_email')
        .eq('id', errandId)
        .single();
      
      if (errand) {
        const { useAppStore } = await import('../stores');
        const appStore = useAppStore.getState();
        if (appStore.addNotification) {
          if (errand.requester_email) {
            appStore.addNotification({
              type: 'success',
              title: 'Errand Completed!',
              message: `"${errand.title}" has been completed!`,
              data: { type: 'errand_completed', errandId }
            });
          }
          if (errand.assigned_helper_email) {
            appStore.addNotification({
              type: 'success',
              title: 'Errand Completed!',
              message: `"${errand.title}" has been completed! Payment will be released.`,
              data: { type: 'errand_completed', errandId }
            });
          }
        }
      }
    }

    return {
      success: true,
      bothConfirmed
    };
  }, {
    context: 'Confirming errand completion',
    showToast: true
  });
}

/**
 * Release payment/credits when errand is completed
 */
export async function releaseErrandPayment(errandId) {
  return await apiCall(async () => {
    if (!supabaseClient) {
      // Demo mode - mark as released
      const storedErrands = await dbLoadSlice(StorageKeys.errands, []);
      const errand = storedErrands.find(e => e.id === errandId);
      if (errand) {
        errand.paymentReleased = true;
        errand.paymentReleasedAt = new Date().toISOString();
        await dbSaveSlice(StorageKeys.errands, storedErrands);
      }
      return { success: true };
    }

    // Get errand details
    const { data: errand, error: fetchError } = await supabaseClient
      .from('errands')
      .select('*')
      .eq('id', errandId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (!errand) {
      throw new Error('Errand not found');
    }

    if (errand.status !== 'completed') {
      throw new Error('Errand must be completed before releasing payment');
    }

    if (errand.payment_released) {
      return { success: true, message: 'Payment already released' };
    }

    // Add credits to helper
    if (errand.assigned_helper_email && errand.budget > 0) {
      try {
        await addCredits(
          errand.assigned_helper_email,
          parseFloat(errand.budget),
          'errand_completion',
          errandId
        );
      } catch (creditError) {
        if (import.meta.env.DEV) {
          console.error('Failed to add credits:', creditError);
        }
        // Don't fail the payment release if credits fail
      }
    }

    // Mark payment as released
    const { error: updateError } = await supabaseClient
      .from('errands')
      .update({
        payment_released: true,
        payment_released_at: new Date().toISOString()
      })
      .eq('id', errandId);

    if (updateError) {
      throw updateError;
    }

    return { success: true };
  }, {
    context: 'Releasing errand payment',
    showToast: true
  });
}

/**
 * Rate helper after errand completion
 */
export async function rateHelper(errandId, raterEmail, rating, comment = null) {
  return await apiCall(async () => {
    if (!supabaseClient) {
      // Demo mode - save to localStorage
      const storedRatings = await dbLoadSlice(StorageKeys.errandRatings, []);
      const newRating = {
        id: Date.now(),
        errandId,
        raterEmail,
        rating,
        comment,
        createdAt: new Date().toISOString()
      };
      storedRatings.push(newRating);
      await dbSaveSlice(StorageKeys.errandRatings, storedRatings);
      return { success: true, rating: newRating };
    }

    // Verify errand is completed and rater is requester
    const { data: errand } = await supabaseClient
      .from('errands')
      .select('requester_email, assigned_helper_email, status')
      .eq('id', errandId)
      .single();

    if (!errand) {
      throw new Error('Errand not found');
    }

    if (errand.requester_email !== raterEmail) {
      throw new Error('Only the requester can rate the helper');
    }

    if (errand.status !== 'completed') {
      throw new Error('Can only rate completed errands');
    }

    // Create or update rating
    const { data, error } = await supabaseClient
      .from('errand_ratings')
      .upsert({
        errand_id: errandId,
        rater_email: raterEmail,
        rated_email: errand.assigned_helper_email,
        rating: rating,
        comment: comment
      }, {
        onConflict: 'errand_id,rater_email'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      rating: {
        id: data.id,
        errandId: data.errand_id,
        raterEmail: data.rater_email,
        ratedEmail: data.rated_email,
        rating: data.rating,
        comment: data.comment,
        createdAt: data.created_at
      }
    };
  }, {
    context: 'Rating helper',
    showToast: true
  });
}

/**
 * Get helper's active errand count
 */
export async function getHelperActiveErrandCount(helperEmail) {
  return await apiCall(async () => {
    if (!supabaseClient) {
      const storedErrands = await dbLoadSlice(StorageKeys.errands, []);
      return {
        success: true,
        count: storedErrands.filter(e =>
          e.assignedHelperEmail === helperEmail &&
          ['assigned', 'in_progress', 'awaiting_confirmation'].includes(e.status)
        ).length
      };
    }

    const { data, error } = await supabaseClient.rpc('get_helper_active_errand_count', {
      helper_email: helperEmail
    });

    if (error) {
      // Fallback to manual count
      const { data: errands } = await supabaseClient
        .from('errands')
        .select('id')
        .eq('assigned_helper_email', helperEmail)
        .in('status', ['assigned', 'in_progress', 'awaiting_confirmation']);

      return {
        success: true,
        count: errands?.length || 0
      };
    }

    return {
      success: true,
      count: data || 0
    };
  }, {
    context: 'Getting helper active errand count',
    showToast: false
  });
}

/**
 * Get maximum active errands per helper
 */
export function getMaxActiveErrandsPerHelper() {
  return MAX_ACTIVE_ERRANDS_PER_HELPER;
}

