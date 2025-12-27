/**
 * Moderation Page
 * Admin-only page for reviewing reports and managing suspensions
 */

import React, { useState, useEffect } from 'react';
import { useUser } from '../stores';
import { isAdmin } from '../utils/authUtils';
import { 
  getReportsForModeration, 
  updateReportStatus, 
  getRepeatOffenders 
} from '../services/reportService';
import {
  suspendUser,
  suspendListing,
  suspendErrand,
  getAllActiveSuspensions
} from '../services/moderationService';
import { 
  Flag, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  UserX, 
  PackageX, 
  FileX,
  Clock,
  Search,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

const ModerationPage = () => {
  const user = useUser();
  const [reports, setReports] = useState([]);
  const [repeatOffenders, setRepeatOffenders] = useState([]);
  const [activeSuspensions, setActiveSuspensions] = useState({ users: [], listings: [], errands: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reports'); // 'reports', 'suspensions', 'offenders'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'reviewing', 'resolved', 'dismissed'
  const [selectedReport, setSelectedReport] = useState(null);
  const [suspensionForm, setSuspensionForm] = useState({
    type: 'user', // 'user', 'listing', 'errand'
    targetId: null,
    reason: '',
    suspensionType: 'warning', // 'warning', 'temporary', 'permanent'
    suspendedUntil: '',
    adminNotes: ''
  });
  const [showSuspensionForm, setShowSuspensionForm] = useState(false);

  // Check admin access
  useEffect(() => {
    if (user && !isAdmin(user)) {
      toast.error('Access denied. Admin privileges required.');
    }
  }, [user]);

  // Load data
  useEffect(() => {
    if (user && isAdmin(user)) {
      loadModerationData();
    }
  }, [user, statusFilter]);

  const loadModerationData = async () => {
    if (!user || !isAdmin(user)) return;
    
    setLoading(true);
    try {
      const [reportsResult, offendersResult, suspensionsResult] = await Promise.all([
        getReportsForModeration(user.email || user.id, statusFilter === 'all' ? null : statusFilter),
        getRepeatOffenders(user.email || user.id, 20),
        getAllActiveSuspensions(user.email || user.id)
      ]);

      if (reportsResult.success) {
        setReports(reportsResult.reports || []);
      }
      if (offendersResult.success) {
        setRepeatOffenders(offendersResult.offenders || []);
      }
      if (suspensionsResult.success) {
        setActiveSuspensions(suspensionsResult.suspensions || { users: [], listings: [], errands: [] });
      }
    } catch (error) {
      console.error('Error loading moderation data:', error);
      toast.error('Failed to load moderation data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReportStatus = async (reportId, newStatus, adminNotes = null) => {
    if (!user || !isAdmin(user)) return;

    try {
      const result = await updateReportStatus(
        reportId,
        newStatus,
        user.email || user.id,
        adminNotes
      );

      if (result.success) {
        toast.success('Report status updated');
        await loadModerationData();
        setSelectedReport(null);
      } else {
        throw new Error(result.error || 'Failed to update report');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update report status');
    }
  };

  const handleSuspend = async () => {
    if (!user || !isAdmin(user)) return;
    if (!suspensionForm.targetId || !suspensionForm.reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      let result;
      const suspendedUntil = suspensionForm.suspendedUntil 
        ? new Date(suspensionForm.suspendedUntil) 
        : null;

      if (suspensionForm.type === 'user') {
        result = await suspendUser(
          suspensionForm.targetId,
          suspensionForm.reason,
          suspensionForm.suspensionType,
          user.email || user.id,
          suspendedUntil,
          suspensionForm.adminNotes
        );
      } else if (suspensionForm.type === 'listing') {
        result = await suspendListing(
          parseInt(suspensionForm.targetId),
          suspensionForm.reason,
          user.email || user.id,
          suspensionForm.adminNotes
        );
      } else if (suspensionForm.type === 'errand') {
        result = await suspendErrand(
          parseInt(suspensionForm.targetId),
          suspensionForm.reason,
          user.email || user.id,
          suspensionForm.adminNotes
        );
      }

      if (result.success) {
        toast.success('Suspension applied successfully');
        setShowSuspensionForm(false);
        setSuspensionForm({
          type: 'user',
          targetId: null,
          reason: '',
          suspensionType: 'warning',
          suspendedUntil: '',
          adminNotes: ''
        });
        await loadModerationData();
      } else {
        throw new Error(result.error || 'Failed to apply suspension');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to apply suspension');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewing': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      case 'escalated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReasonLabel = (reason) => {
    const labels = {
      spam: 'Spam or Misleading',
      fraud: 'Fraud or Scam',
      inappropriate_content: 'Inappropriate Content',
      harassment: 'Harassment',
      fake_product: 'Fake Product',
      scam: 'Scam',
      other: 'Other'
    };
    return labels[reason] || reason;
  };

  if (!user || !isAdmin(user)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle className="text-red-600 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-700">Admin privileges required to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Moderation Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'reports'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Flag size={18} />
            Reports ({reports.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('suspensions')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'suspensions'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <UserX size={18} />
            Suspensions
          </div>
        </button>
        <button
          onClick={() => setActiveTab('offenders')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'offenders'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} />
            Repeat Offenders ({repeatOffenders.length})
          </div>
        </button>
      </div>

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-600" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewing">Reviewing</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
          </div>

          {/* Reports List */}
          {reports.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <Flag className="text-gray-400 mx-auto mb-4" size={48} />
              <p className="text-gray-600">No reports found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map(report => (
                <div key={report.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                        <span className="text-sm text-gray-600">
                          {report.report_type} • ID: {report.target_id}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Reason: {getReasonLabel(report.reason)}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Reported by: {report.reporter_email}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(report.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.description}</p>
                  </div>

                  {report.admin_notes && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p className="text-sm font-medium text-blue-900 mb-1">Admin Notes:</p>
                      <p className="text-sm text-blue-800">{report.admin_notes}</p>
                    </div>
                  )}

                  {report.reviewed_by && (
                    <p className="text-xs text-gray-500 mb-4">
                      Reviewed by {report.reviewed_by} on {new Date(report.reviewed_at).toLocaleString()}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {report.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateReportStatus(report.id, 'reviewing')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm min-h-[44px]"
                        >
                          Start Review
                        </button>
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setSuspensionForm({
                              type: report.report_type === 'listing' ? 'listing' : 
                                    report.report_type === 'errand' ? 'errand' : 'user',
                              targetId: report.target_id.toString(),
                              reason: report.reason,
                              suspensionType: 'warning',
                              suspendedUntil: '',
                              adminNotes: ''
                            });
                            setShowSuspensionForm(true);
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm min-h-[44px]"
                        >
                          Suspend
                        </button>
                      </>
                    )}
                    {report.status === 'reviewing' && (
                      <>
                        <button
                          onClick={() => handleUpdateReportStatus(report.id, 'resolved', 'Issue resolved')}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm min-h-[44px]"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => handleUpdateReportStatus(report.id, 'dismissed', 'False report')}
                          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm min-h-[44px]"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suspensions Tab */}
      {activeTab === 'suspensions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Active Suspensions</h2>
            <button
              onClick={() => {
                setSuspensionForm({
                  type: 'user',
                  targetId: '',
                  reason: '',
                  suspensionType: 'warning',
                  suspendedUntil: '',
                  adminNotes: ''
                });
                setShowSuspensionForm(true);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors min-h-[44px]"
            >
              New Suspension
            </button>
          </div>

          {/* User Suspensions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">User Suspensions ({activeSuspensions.users.length})</h3>
            {activeSuspensions.users.length === 0 ? (
              <p className="text-gray-600">No active user suspensions</p>
            ) : (
              <div className="space-y-3">
                {activeSuspensions.users.map(suspension => (
                  <div key={suspension.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{suspension.user_email}</p>
                        <p className="text-sm text-gray-600">Type: {suspension.suspension_type}</p>
                        <p className="text-sm text-gray-600">Reason: {suspension.reason}</p>
                        {suspension.suspended_until && (
                          <p className="text-sm text-gray-600">
                            Until: {new Date(suspension.suspended_until).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Listing Suspensions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Listing Suspensions ({activeSuspensions.listings.length})</h3>
            {activeSuspensions.listings.length === 0 ? (
              <p className="text-gray-600">No active listing suspensions</p>
            ) : (
              <div className="space-y-3">
                {activeSuspensions.listings.map(suspension => (
                  <div key={suspension.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                    <p className="font-semibold text-gray-900">Listing ID: {suspension.listing_id}</p>
                    <p className="text-sm text-gray-600">Reason: {suspension.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Errand Suspensions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Errand Suspensions ({activeSuspensions.errands.length})</h3>
            {activeSuspensions.errands.length === 0 ? (
              <p className="text-gray-600">No active errand suspensions</p>
            ) : (
              <div className="space-y-3">
                {activeSuspensions.errands.map(suspension => (
                  <div key={suspension.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                    <p className="font-semibold text-gray-900">Errand ID: {suspension.errand_id}</p>
                    <p className="text-sm text-gray-600">Reason: {suspension.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Repeat Offenders Tab */}
      {activeTab === 'offenders' && (
        <div className="space-y-4">
          {repeatOffenders.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <AlertTriangle className="text-gray-400 mx-auto mb-4" size={48} />
              <p className="text-gray-600">No repeat offenders found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {repeatOffenders.map(offender => (
                <div key={offender.target_email} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {offender.target_email}
                      </h3>
                      <p className="text-sm text-gray-600">
                        <strong>{offender.report_count}</strong> reports
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Latest: {new Date(offender.latest_report_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSuspensionForm({
                          type: 'user',
                          targetId: offender.target_email,
                          reason: 'Multiple reports',
                          suspensionType: 'temporary',
                          suspendedUntil: '',
                          adminNotes: `${offender.report_count} reports received`
                        });
                        setShowSuspensionForm(true);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm min-h-[44px]"
                    >
                      Suspend User
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suspension Form Modal */}
      {showSuspensionForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowSuspensionForm(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Apply Suspension</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target ID/Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={suspensionForm.targetId || ''}
                    onChange={(e) => setSuspensionForm(prev => ({ ...prev, targetId: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
                    placeholder={suspensionForm.type === 'user' ? 'user@example.com' : '123'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={suspensionForm.reason}
                    onChange={(e) => setSuspensionForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
                    placeholder="Reason for suspension"
                  />
                </div>

                {suspensionForm.type === 'user' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Suspension Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={suspensionForm.suspensionType}
                        onChange={(e) => setSuspensionForm(prev => ({ ...prev, suspensionType: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
                      >
                        <option value="warning">Warning</option>
                        <option value="temporary">Temporary</option>
                        <option value="permanent">Permanent</option>
                      </select>
                    </div>

                    {suspensionForm.suspensionType === 'temporary' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Suspended Until
                        </label>
                        <input
                          type="datetime-local"
                          value={suspensionForm.suspendedUntil}
                          onChange={(e) => setSuspensionForm(prev => ({ ...prev, suspendedUntil: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
                        />
                      </div>
                    )}
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Notes
                  </label>
                  <textarea
                    value={suspensionForm.adminNotes}
                    onChange={(e) => setSuspensionForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[88px]"
                    placeholder="Internal notes (optional)"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSuspensionForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSuspend}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors min-h-[44px]"
                >
                  Apply Suspension
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModerationPage;

