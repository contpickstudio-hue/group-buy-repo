import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useUser } from '../stores';
import { createReport, hasUserReported } from '../services/reportService';
import toast from 'react-hot-toast';

/**
 * Report Modal Component
 * Allows users to submit reports with reason and description
 */
const ReportModal = ({ isOpen, onClose, reportType, targetId, targetTitle }) => {
  const user = useUser();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const reportReasons = {
    listing: [
      { value: 'spam', label: 'Spam or misleading' },
      { value: 'fraud', label: 'Fraud or scam' },
      { value: 'fake_product', label: 'Fake product' },
      { value: 'inappropriate_content', label: 'Inappropriate content' },
      { value: 'other', label: 'Other' }
    ],
    errand: [
      { value: 'spam', label: 'Spam or misleading' },
      { value: 'fraud', label: 'Fraud or scam' },
      { value: 'harassment', label: 'Harassment' },
      { value: 'inappropriate_content', label: 'Inappropriate content' },
      { value: 'other', label: 'Other' }
    ],
    user: [
      { value: 'harassment', label: 'Harassment' },
      { value: 'fraud', label: 'Fraud or scam' },
      { value: 'spam', label: 'Spam' },
      { value: 'inappropriate_content', label: 'Inappropriate content' },
      { value: 'other', label: 'Other' }
    ],
    message: [
      { value: 'harassment', label: 'Harassment' },
      { value: 'spam', label: 'Spam' },
      { value: 'inappropriate_content', label: 'Inappropriate content' },
      { value: 'other', label: 'Other' }
    ]
  };

  const reasons = reportReasons[reportType] || reportReasons.listing;

  // Check if user has already reported
  useEffect(() => {
    if (isOpen && user) {
      const checkReport = async () => {
        setIsChecking(true);
        try {
          const result = await hasUserReported(
            user.email || user.id,
            reportType,
            targetId
          );
          if (result.success) {
            setHasReported(result.hasReported);
          }
        } catch (error) {
          console.error('Error checking report status:', error);
        } finally {
          setIsChecking(false);
        }
      };
      checkReport();
    }
  }, [isOpen, user, reportType, targetId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setReason('');
      setDescription('');
      setHasReported(false);
      setIsChecking(true);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to submit a report');
      return;
    }

    if (!reason) {
      toast.error('Please select a reason');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      toast.error('Please provide a description (at least 10 characters)');
      return;
    }

    if (description.trim().length > 1000) {
      toast.error('Description must be less than 1000 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createReport(
        user.email || user.id,
        reportType,
        targetId,
        reason,
        description.trim()
      );

      if (result.success) {
        toast.success('Report submitted successfully. Thank you for helping keep our community safe.');
        onClose();
      } else {
        throw new Error(result.error || 'Failed to submit report');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-red-600" size={20} />
              <h2 className="text-xl font-semibold text-gray-900">Report Content</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          {isChecking ? (
            <div className="py-8 text-center text-gray-600">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p>Checking...</p>
            </div>
          ) : hasReported ? (
            <div className="py-8 text-center">
              <AlertTriangle className="text-yellow-600 mx-auto mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Report Already Submitted</h3>
              <p className="text-gray-600 mb-4">
                You have already submitted a report for this item. Our team will review it shortly.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors min-h-[44px]"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {targetTitle && (
                <div className="bg-gray-50 rounded-md p-3 mb-4">
                  <p className="text-sm text-gray-600 mb-1">Reporting:</p>
                  <p className="text-sm font-medium text-gray-900">{targetTitle}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Report <span className="text-red-500">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
                  required
                >
                  <option value="">Select a reason</option>
                  {reasons.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                  <span className="text-gray-500 text-xs ml-2">
                    ({description.length}/1000 characters, minimum 10)
                  </span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Please provide details about why you're reporting this content..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[120px] resize-vertical"
                  required
                  maxLength={1000}
                />
                {description.length < 10 && description.length > 0 && (
                  <p className="mt-1 text-sm text-red-600">
                    Description must be at least 10 characters
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> False reports may result in action against your account. 
                  Please only report content that violates our community guidelines.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors min-h-[44px]"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || !reason || description.trim().length < 10}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportModal;

