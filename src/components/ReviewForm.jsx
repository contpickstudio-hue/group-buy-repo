/**
 * Review Form Component
 * Allows users to submit ratings and reviews
 */

import React, { useState } from 'react';
import { createVendorReview, createHelperReview } from '../services/reviewService';

const ReviewForm = ({ orderId, errandId, vendorEmail, helperEmail, onSuccess, onCancel }) => {
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }

        setSubmitting(true);
        try {
            if (orderId && vendorEmail) {
                const result = await createVendorReview({
                    orderId,
                    vendorEmail,
                    rating,
                    reviewText: reviewText.trim() || null
                });
                if (result.success && onSuccess) {
                    onSuccess(result.data);
                }
            } else if (errandId && helperEmail) {
                const result = await createHelperReview({
                    errandId,
                    helperEmail,
                    rating,
                    reviewText: reviewText.trim() || null
                });
                if (result.success && onSuccess) {
                    onSuccess(result.data);
                }
            }
        } catch (error) {
            alert(`Failed to submit review: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating *
                </label>
                <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className={`text-2xl ${
                                star <= rating ? 'text-yellow-400' : 'text-gray-300'
                            } hover:text-yellow-400 transition-colors`}
                        >
                            ★
                        </button>
                    ))}
                </div>
                {rating > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                        {rating === 5 ? 'Excellent' :
                         rating === 4 ? 'Good' :
                         rating === 3 ? 'Average' :
                         rating === 2 ? 'Poor' : 'Very Poor'}
                    </p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review (Optional)
                </label>
                <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Share your experience..."
                />
            </div>

            <div className="flex space-x-3">
                <button
                    type="submit"
                    disabled={submitting || rating === 0}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
};

export default ReviewForm;

