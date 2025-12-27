import React, { useEffect, useState } from 'react';
import { DollarSign, Gift, Clock, CheckCircle } from 'lucide-react';
import { 
  useCredits, 
  useCreditsHistory,
  useLoadCredits,
  useLoadCreditsHistory 
} from '../stores';
import { useAuthStore } from '../stores/authStore';
import { useUser } from '../stores';
import { isGuestUser } from '../utils/authUtils';

/**
 * CreditsDisplay Component
 * Displays user's credit balance and history
 */
const CreditsDisplay = ({ showHistory = true, compact = false }) => {
  const credits = useCredits();
  const creditsHistory = useCreditsHistory();
  const loadCredits = useLoadCredits();
  const loadCreditsHistory = useLoadCreditsHistory();
  const user = useUser();
  const loginMethod = useAuthStore((state) => state.loginMethod);
  const isGuest = isGuestUser(user, loginMethod);

  useEffect(() => {
    if (!isGuest) {
      loadCredits();
      if (showHistory) {
        loadCreditsHistory(20);
      }
    }
  }, [loadCredits, loadCreditsHistory, showHistory, isGuest]);

  // Show guest message for compact view
  if (compact && isGuest) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
        <Gift size={18} className="text-gray-400" />
        <span className="text-sm text-gray-500">Sign up to view credits</span>
      </div>
    );
  }

  // Show guest message for full view
  if (isGuest) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Guest Preview Access
          </h3>
          <p className="text-yellow-700 mb-4">
            Credits are only available to registered users. Please sign up to access this feature.
          </p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatExpiry = (dateString) => {
    if (!dateString) return 'No expiry';
    const date = new Date(dateString);
    const now = new Date();
    const daysLeft = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return 'Expired';
    if (daysLeft === 0) return 'Expires today';
    if (daysLeft === 1) return 'Expires tomorrow';
    return `Expires in ${daysLeft} days`;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
        <Gift size={18} className="text-green-600" />
        <span className="font-semibold text-green-800">
          ${(credits.balance || 0).toFixed(2)} credits
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-green-100 rounded-lg">
          <DollarSign size={24} className="text-green-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">Credits</h3>
          <p className="text-sm text-gray-600">Your account balance</p>
        </div>
      </div>

      {/* Balance Display */}
      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
        <div className="text-sm text-gray-600 mb-1">Available Balance</div>
        <div className="text-3xl font-bold text-green-600">
          ${(credits.balance || 0).toFixed(2)}
        </div>
        {credits.credits && credits.credits.length > 0 && (
          <div className="text-xs text-gray-500 mt-2">
            {credits.credits.length} credit{credits.credits.length !== 1 ? 's' : ''} available
          </div>
        )}
      </div>

      {/* Credit History */}
      {showHistory && creditsHistory && creditsHistory.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-3">Recent Activity</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {creditsHistory.slice(0, 10).map((credit) => (
              <div
                key={credit.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {credit.used_at ? (
                    <CheckCircle size={20} className="text-gray-400" />
                  ) : (
                    <Gift size={20} className="text-green-500" />
                  )}
                  <div>
                    <div className="font-medium text-gray-900">
                      {credit.source === 'referral' && 'Referral Bonus'}
                      {credit.source === 'bonus' && 'Bonus Credit'}
                      {credit.source === 'promotion' && 'Promotional Credit'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {credit.used_at 
                        ? `Used on ${formatDate(credit.used_at)}`
                        : formatExpiry(credit.expires_at)
                      }
                    </div>
                  </div>
                </div>
                <div className={`font-semibold ${credit.used_at ? 'text-gray-400' : 'text-green-600'}`}>
                  {credit.used_at ? '-' : '+'}${parseFloat(credit.amount || 0).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showHistory && (!creditsHistory || creditsHistory.length === 0) && (
        <div className="text-center py-8 text-gray-500">
          <Clock size={48} className="mx-auto mb-2 opacity-50" />
          <p>No credit history yet</p>
        </div>
      )}
    </div>
  );
};

export default CreditsDisplay;

