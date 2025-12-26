import React from 'react';

/**
 * VerifiedBadge Component
 * Displays a verified badge next to user names
 */
const VerifiedBadge = ({ showTooltip = false }) => {
  return (
    <span 
      className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold rounded-full shadow-sm"
      title={showTooltip ? "Verified Neighbor - Identity and address verified" : undefined}
    >
      <svg 
        className="w-3 h-3" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M5 13l4 4L19 7" 
        />
      </svg>
      Verified Neighbor
    </span>
  );
};

export default VerifiedBadge;

