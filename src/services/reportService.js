/**
 * Report Service
 * Handles reporting functionality with abuse prevention
 */

import { supabaseClient } from './supabaseService';
import { apiCall } from './errorService';
import { setStorageItem, getStorageItem } from '../utils/storageUtils';

const StorageKeys = {
  reports: 'reports',
  reportRateLimits: 'reportRateLimits'
};

/**
 * Create a report
 * @param {string} reporterEmail - Email of the user making the report
 * @param {string} reportType - Type of report: 'listing', 'errand', 'user', 'message'
 * @param {number} targetId - ID of the reported item
 * @param {string} reason - Reason for report
 * @param {string} description - Detailed description
 * @returns {Promise<{success: boolean, reportId?: number, error?: string}>}
 */
export async function createReport(reporterEmail, reportType, targetId, reason, description) {
  return await apiCall(async () => {
    // Validate inputs
    if (!reporterEmail || !reportType || !targetId || !reason || !description) {
      throw new Error('All report fields are required');
    }

    if (description.trim().length < 10) {
      throw new Error('Description must be at least 10 characters');
    }

    if (description.trim().length > 1000) {
      throw new Error('Description must be less than 1000 characters');
    }

    // Check if user is authenticated
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
      // Demo user - store in localStorage
      const reports = await getStorageItem(StorageKeys.reports, []);
      const newReport = {
        id: Date.now(),
        reporter_email: reporterEmail,
        report_type: reportType,
        target_id: targetId,
        reason,
        description: description.trim(),
        status: 'pending',
        created_at: new Date().toISOString()
      };
      reports.push(newReport);
      await setStorageItem(StorageKeys.reports, reports);
      return { success: true, reportId: newReport.id };
    }

    // Call RPC function with rate limiting
    const { data, error } = await supabaseClient.rpc('create_report', {
      p_reporter_email: reporterEmail,
      p_report_type: reportType,
      p_target_id: targetId,
      p_reason: reason,
      p_description: description.trim()
    });

    if (error) {
      throw new Error(error.message || 'Failed to create report');
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned from report creation');
    }

    const result = data[0];
    if (!result.success) {
      throw new Error(result.error_message || 'Failed to create report');
    }

    return { success: true, reportId: result.report_id };
  });
}

/**
 * Get reports for moderation (admin only)
 * @param {string} adminEmail - Admin email
 * @param {string} status - Filter by status (optional)
 * @returns {Promise<{success: boolean, reports?: Array, error?: string}>}
 */
export async function getReportsForModeration(adminEmail, status = null) {
  return await apiCall(async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
      // Demo user - return empty array
      return { success: true, reports: [] };
    }

    let query = supabaseClient
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message || 'Failed to load reports');
    }

    return { success: true, reports: data || [] };
  });
}

/**
 * Update report status (admin only)
 * @param {number} reportId - Report ID
 * @param {string} status - New status
 * @param {string} adminEmail - Admin email
 * @param {string} adminNotes - Admin notes (optional)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateReportStatus(reportId, status, adminEmail, adminNotes = null) {
  return await apiCall(async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
      // Demo user - update localStorage
      const reports = await getStorageItem(StorageKeys.reports, []);
      const reportIndex = reports.findIndex(r => r.id === reportId);
      if (reportIndex !== -1) {
        reports[reportIndex].status = status;
        reports[reportIndex].reviewed_by = adminEmail;
        reports[reportIndex].reviewed_at = new Date().toISOString();
        if (adminNotes) {
          reports[reportIndex].admin_notes = adminNotes;
        }
        await setStorageItem(StorageKeys.reports, reports);
      }
      return { success: true };
    }

    const updateData = {
      status,
      reviewed_by: adminEmail,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (adminNotes) {
      updateData.admin_notes = adminNotes;
    }

    const { error } = await supabaseClient
      .from('reports')
      .update(updateData)
      .eq('id', reportId);

    if (error) {
      throw new Error(error.message || 'Failed to update report');
    }

    return { success: true };
  });
}

/**
 * Get repeat offenders
 * @param {string} adminEmail - Admin email
 * @param {number} limit - Number of results to return
 * @returns {Promise<{success: boolean, offenders?: Array, error?: string}>}
 */
export async function getRepeatOffenders(adminEmail, limit = 10) {
  return await apiCall(async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
      return { success: true, offenders: [] };
    }

    const { data, error } = await supabaseClient.rpc('get_repeat_offenders', {
      limit_count: limit
    });

    if (error) {
      throw new Error(error.message || 'Failed to load repeat offenders');
    }

    return { success: true, offenders: data || [] };
  });
}

/**
 * Check if user has already reported this item
 * @param {string} reporterEmail - User email
 * @param {string} reportType - Type of report
 * @param {number} targetId - Target ID
 * @returns {Promise<{success: boolean, hasReported?: boolean, error?: string}>}
 */
export async function hasUserReported(reporterEmail, reportType, targetId) {
  return await apiCall(async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
      // Check localStorage
      const reports = await getStorageItem(StorageKeys.reports, []);
      const hasReported = reports.some(r => 
        r.reporter_email === reporterEmail &&
        r.report_type === reportType &&
        r.target_id === targetId &&
        (r.status === 'pending' || r.status === 'reviewing')
      );
      return { success: true, hasReported };
    }

    const { data, error } = await supabaseClient
      .from('reports')
      .select('id')
      .eq('reporter_email', reporterEmail)
      .eq('report_type', reportType)
      .eq('target_id', targetId)
      .in('status', ['pending', 'reviewing'])
      .limit(1);

    if (error) {
      throw new Error(error.message || 'Failed to check report status');
    }

    return { success: true, hasReported: (data && data.length > 0) };
  });
}

