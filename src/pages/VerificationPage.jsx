import React, { useState, useEffect } from 'react';
import { useUser } from '../stores';
import { 
  uploadIDDocument, 
  uploadAddressDocument, 
  getVerificationStatus 
} from '../services/verificationService';
import VerifiedBadge from '../components/VerifiedBadge';
import toast from 'react-hot-toast';

/**
 * VerificationPage Component
 * Multi-step verification form for user verification
 */
const VerificationPage = () => {
  const user = useUser();
  const [step, setStep] = useState(1); // 1: ID, 2: Address, 3: Phone (optional)
  const [idFiles, setIdFiles] = useState({ front: null, back: null });
  const [addressFile, setAddressFile] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.email) {
      loadVerificationStatus();
    }
  }, [user]);

  const loadVerificationStatus = async () => {
    try {
      const result = await getVerificationStatus(user.email);
      if (result.success) {
        setVerificationStatus(result.status);
        // Set step based on what's already submitted
        if (result.status.verifications.some(v => v.verification_type === 'id')) {
          setStep(2);
        }
        if (result.status.verifications.some(v => v.verification_type === 'address')) {
          setStep(3);
        }
      }
    } catch (error) {
      console.error('Failed to load verification status:', error);
    }
  };

  const handleIDUpload = async (side, file) => {
    if (!file) return;
    
    setLoading(true);
    try {
      const result = await uploadIDDocument(file, user.email);
      if (result.success) {
        setIdFiles(prev => ({ ...prev, [side]: file }));
        toast.success(`${side === 'front' ? 'Front' : 'Back'} ID uploaded successfully`);
        if (side === 'front' && !idFiles.back) {
          // Move to back upload
          setStep(1.5); // Intermediate step
        } else if (side === 'back') {
          // Both uploaded, move to address
          setStep(2);
        }
      }
    } catch (error) {
      toast.error(`Failed to upload ${side} ID: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressUpload = async (file) => {
    if (!file) return;
    
    setLoading(true);
    try {
      const result = await uploadAddressDocument(file, user.email);
      if (result.success) {
        setAddressFile(file);
        toast.success('Address document uploaded successfully');
        setStep(3);
      }
    } catch (error) {
      toast.error(`Failed to upload address document: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center text-gray-500">
          Please sign in to verify your account
        </div>
      </div>
    );
  }

  const isVerified = verificationStatus?.isVerified;
  const hasPending = verificationStatus?.hasPending;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Get Verified</h1>
          <p className="text-gray-600">
            Become a Verified Neighbor to build trust in the community
          </p>
        </div>

        {/* Status Display */}
        {isVerified && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <VerifiedBadge />
              <div>
                <p className="font-semibold text-green-900">You're verified!</p>
                <p className="text-sm text-green-700">
                  Verified on {new Date(verificationStatus.verifiedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {hasPending && !isVerified && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="font-semibold text-yellow-900">Verification Pending</p>
            <p className="text-sm text-yellow-700">
              Your verification request is being reviewed. This usually takes 1-2 business days.
            </p>
          </div>
        )}

        {/* Verification Steps */}
        {!isVerified && (
          <div className="space-y-6">
            {/* Step 1: ID Document */}
            {step <= 2 && (
              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Step 1: Identity Verification</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Upload photos of your government-issued ID (driver's license, passport, etc.)
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID Front
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) handleIDUpload('front', file);
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      disabled={loading}
                    />
                    {idFiles.front && (
                      <p className="text-sm text-green-600 mt-1">✓ Uploaded</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID Back
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) handleIDUpload('back', file);
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      disabled={loading}
                    />
                    {idFiles.back && (
                      <p className="text-sm text-green-600 mt-1">✓ Uploaded</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Address Verification */}
            {step >= 2 && (
              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Step 2: Address Verification</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Upload a document proving your address (utility bill, bank statement, etc.)
                </p>
                
                <div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) handleAddressUpload(file);
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={loading}
                  />
                  {addressFile && (
                    <p className="text-sm text-green-600 mt-2">✓ Uploaded: {addressFile.name}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Completion */}
            {step >= 3 && (
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <h2 className="text-lg font-semibold mb-4">Step 3: Review</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Your verification request has been submitted. Our team will review your documents 
                  within 1-2 business days. You'll be notified once your verification is approved.
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-600">✓</span>
                  <span>ID Documents Submitted</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-2">
                  <span className="text-green-600">✓</span>
                  <span>Address Document Submitted</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationPage;

