/**
 * Rating Display Component
 * Shows average rating with stars
 */

import React from 'react';

const RatingDisplay = ({ rating, totalReviews, showCount = true, size = 'md' }) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    const starSize = {
        sm: 'text-sm',
        md: 'text-lg',
        lg: 'text-2xl'
    }[size] || 'text-lg';

    return (
        <div className="flex items-center space-x-2">
            <div className={`${starSize} flex items-center`}>
                {[...Array(fullStars)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                ))}
                {hasHalfStar && <span className="text-yellow-400">☆</span>}
                {[...Array(emptyStars)].map((_, i) => (
                    <span key={i} className="text-gray-300">★</span>
                ))}
            </div>
            {rating > 0 && (
                <span className="text-gray-600 font-medium">
                    {rating.toFixed(1)}
                </span>
            )}
            {showCount && totalReviews > 0 && (
                <span className="text-gray-500 text-sm">
                    ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                </span>
            )}
        </div>
    );
};

export default RatingDisplay;

