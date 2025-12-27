import React from 'react';
import { useSetCurrentScreen } from '../stores';
import { Lock, ArrowRight } from 'lucide-react';

/**
 * Permission Denied Component
 * Shows a friendly message when user doesn't have required permissions
 */
const PermissionDenied = ({ 
  requiredRole, 
  action = 'perform this action',
  showUpgradeCTA = true 
}) => {
  const setCurrentScreen = useSetCurrentScreen();

  const getRoleTitle = () => {
    const titles = {
      vendor: 'Vendor Account Required',
      customer: 'Customer Account Required',
      helper: 'Helper Account Required'
    };
    return titles[requiredRole] || 'Permission Required';
  };

  const getRoleDescription = () => {
    const descriptions = {
      vendor: 'To create group buys, you need a vendor account. Upgrade your account to start creating group buys and reaching more customers.',
      customer: 'To join group buys, you need a customer account. Sign up or ensure your account has customer permissions.',
      helper: 'To apply to errands, you need to be a verified helper. Complete the helper verification process to start helping others.'
    };
    return descriptions[requiredRole] || `You need ${requiredRole} permissions to ${action}.`;
  };

  const handleUpgrade = () => {
    if (requiredRole === 'helper') {
      // Navigate to verification/helper onboarding
      setCurrentScreen('profile');
    } else {
      // Navigate to profile or account settings
      setCurrentScreen('profile');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="bg-red-100 rounded-full p-4">
            <Lock className="w-12 h-12 text-red-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          {getRoleTitle()}
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
          {getRoleDescription()}
        </p>

        {/* Action Buttons */}
        {showUpgradeCTA && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleUpgrade}
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium min-h-[44px]"
            >
              {requiredRole === 'helper' ? 'Complete Verification' : 'Upgrade Account'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentScreen('browse')}
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium min-h-[44px]"
            >
              Browse Marketplace
            </button>
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Need help? Contact support for assistance with account permissions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PermissionDenied;

