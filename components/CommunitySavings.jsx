import React, { useEffect } from 'react';
import { TrendingUp, Users, Gift } from 'lucide-react';
import {
  useCommunitySavings,
  useUserContribution,
  useLoadCommunityStats,
  useLoadUserContribution
} from '../stores';

/**
 * CommunitySavings Component
 * Displays community savings statistics
 */
const CommunitySavings = ({ compact = false }) => {
  const communitySavings = useCommunitySavings();
  const userContribution = useUserContribution();
  const loadCommunityStats = useLoadCommunityStats();
  const loadUserContribution = useLoadUserContribution();

  useEffect(() => {
    loadCommunityStats();
    loadUserContribution();
  }, [loadCommunityStats, loadUserContribution]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={20} />
          <span className="text-sm font-medium">Community Savings</span>
        </div>
        <div className="text-2xl font-bold">
          {formatCurrency(communitySavings)}
        </div>
        <div className="text-sm opacity-90 mt-1">
          You've contributed {formatCurrency(userContribution)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white bg-opacity-20 rounded-lg">
          <TrendingUp size={24} />
        </div>
        <div>
          <h3 className="text-xl font-semibold">Community Savings</h3>
          <p className="text-sm opacity-90">Together we save more!</p>
        </div>
      </div>

      {/* Total Community Savings */}
      <div className="mb-6">
        <div className="text-4xl font-bold mb-2">
          {formatCurrency(communitySavings)}
        </div>
        <div className="text-sm opacity-90">
          Total savings across all completed group buys
        </div>
      </div>

      {/* User Contribution */}
      <div className="bg-white bg-opacity-20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Gift size={18} />
          <span className="font-semibold">Your Contribution</span>
        </div>
        <div className="text-2xl font-bold">
          {formatCurrency(userContribution)}
        </div>
        <div className="text-sm opacity-90 mt-1">
          {userContribution > 0 
            ? `You've helped save ${formatCurrency(userContribution)}!`
            : 'Start participating to contribute to community savings!'
          }
        </div>
      </div>

      {/* Progress Indicator */}
      {communitySavings > 0 && userContribution > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Your contribution</span>
            <span>{((userContribution / communitySavings) * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all"
              style={{ width: `${Math.min((userContribution / communitySavings) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="mt-6 pt-4 border-t border-white border-opacity-20">
        <p className="text-sm opacity-90 text-center">
          Join the movement! Invite neighbors and save together.
        </p>
      </div>
    </div>
  );
};

export default CommunitySavings;

