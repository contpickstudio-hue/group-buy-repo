import React from 'react';
import { Award, Users, Star, Crown } from 'lucide-react';
import { useReferralStats } from '../stores';

/**
 * ReferralBadges Component
 * Displays referral achievement badges
 */
const ReferralBadges = () => {
  const referralStats = useReferralStats();
  const successfulReferrals = referralStats.successfulReferrals || 0;

  const badges = [
    {
      id: 'first-friend',
      name: 'First Friend',
      description: 'Invited 1 friend',
      icon: Award,
      threshold: 1,
      color: 'bg-blue-500'
    },
    {
      id: 'community-builder',
      name: 'Community Builder',
      description: 'Invited 5 friends',
      icon: Users,
      threshold: 5,
      color: 'bg-green-500'
    },
    {
      id: 'neighborhood-champion',
      name: 'Neighborhood Champion',
      description: 'Invited 10 friends',
      icon: Star,
      threshold: 10,
      color: 'bg-purple-500'
    },
    {
      id: 'local-legend',
      name: 'Local Legend',
      description: 'Invited 25 friends',
      icon: Crown,
      threshold: 25,
      color: 'bg-yellow-500'
    }
  ];

  const earnedBadges = badges.filter(badge => successfulReferrals >= badge.threshold);
  const nextBadge = badges.find(badge => successfulReferrals < badge.threshold);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">Referral Badges</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {badges.map((badge) => {
          const isEarned = successfulReferrals >= badge.threshold;
          const Icon = badge.icon;
          
          return (
            <div
              key={badge.id}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                isEarned
                  ? `${badge.color} text-white border-transparent`
                  : 'bg-gray-100 text-gray-400 border-gray-300'
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <Icon size={32} className="mb-2" />
                <div className="font-semibold text-sm">{badge.name}</div>
                <div className="text-xs mt-1 opacity-80">{badge.description}</div>
              </div>
              {isEarned && (
                <div className="absolute top-1 right-1">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {nextBadge && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Next badge:</strong> {nextBadge.name} - Invite {nextBadge.threshold - successfulReferrals} more friend{nextBadge.threshold - successfulReferrals !== 1 ? 's' : ''}!
          </p>
        </div>
      )}
    </div>
  );
};

export default ReferralBadges;

