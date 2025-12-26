import { supabaseClient } from './supabaseService';
import { apiCall } from './errorService';

/**
 * Verification Service
 * Handles user verification document uploads and status management
 */

/**
 * Upload verification document to Supabase Storage
 */
export async function uploadVerificationDocument(file, verificationType, userEmail) {
  return await apiCall(async () => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userEmail}/${verificationType}_${Date.now()}.${fileExt}`;
    const filePath = `verification-documents/${fileName}`;

    const { data, error } = await supabaseClient.storage
      .from('verification-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL (or signed URL for private files)
    const { data: { publicUrl } } = supabaseClient.storage
      .from('verification-documents')
      .getPublicUrl(filePath);

    return { success: true, filePath, publicUrl };
  }, {
    context: 'Uploading verification document',
    showToast: false
  });
}

/**
 * Submit verification request
 */
export async function submitVerificationRequest(verificationData) {
  return await apiCall(async () => {
    const { userEmail, verificationType, documentData } = verificationData;

    const { data, error } = await supabaseClient
      .from('user_verifications')
      .insert({
        user_email: userEmail,
        verification_type: verificationType,
        document_data: documentData,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, verification: data };
  }, {
    context: 'Submitting verification request',
    showToast: false
  });
}

/**
 * Get verification status for a user
 */
export async function getVerificationStatus(userEmail) {
  return await apiCall(async () => {
    const { data, error } = await supabaseClient
      .from('user_verifications')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Determine overall verification status
    const hasApproved = data.some(v => v.status === 'approved');
    const hasPending = data.some(v => v.status === 'pending');
    const hasRejected = data.some(v => v.status === 'rejected');
    
    const latestApproved = data.find(v => v.status === 'approved');

    return {
      success: true,
      status: {
        isVerified: hasApproved,
        hasPending,
        hasRejected,
        verifiedAt: latestApproved?.verified_at || null,
        verifications: data
      }
    };
  }, {
    context: 'Getting verification status',
    showToast: false
  });
}

/**
 * Get list of verified users (for badge display)
 * This would typically be used to check if a specific user is verified
 */
export async function isUserVerified(userEmail) {
  return await apiCall(async () => {
    const { data, error } = await supabaseClient
      .from('user_verifications')
      .select('status, verified_at')
      .eq('user_email', userEmail)
      .eq('status', 'approved')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return {
      success: true,
      isVerified: !!data,
      verifiedAt: data?.verified_at || null
    };
  }, {
    context: 'Checking if user is verified',
    showToast: false
  });
}

/**
 * Upload ID document
 */
export async function uploadIDDocument(file, userEmail) {
  const uploadResult = await uploadVerificationDocument(file, 'id', userEmail);
  if (!uploadResult.success) {
    return uploadResult;
  }

  return await submitVerificationRequest({
    userEmail,
    verificationType: 'id',
    documentData: {
      filePath: uploadResult.filePath,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString()
    }
  });
}

/**
 * Upload address verification document
 */
export async function uploadAddressDocument(file, userEmail) {
  const uploadResult = await uploadVerificationDocument(file, 'address', userEmail);
  if (!uploadResult.success) {
    return uploadResult;
  }

  return await submitVerificationRequest({
    userEmail,
    verificationType: 'address',
    documentData: {
      filePath: uploadResult.filePath,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString()
    }
  });
}

