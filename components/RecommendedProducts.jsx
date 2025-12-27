/**
 * Recommended Products Component
 * Displays AI-driven product recommendations (placeholder for now)
 */

import React, { useState, useEffect } from 'react';
import { useUser } from '../stores';
import { getRecommendedProducts } from '../services/recommendationService';
import { useProductViewTracking } from '../hooks/useEngagementTracking';

const RecommendedProducts = ({ limit = 6 }) => {
    const user = useUser();
    const [recommendedProducts, setRecommendedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const trackView = useProductViewTracking();

    useEffect(() => {
        loadRecommendations();
    }, [user]);

    const loadRecommendations = async () => {
        try {
            setLoading(true);
            const result = await getRecommendedProducts(user?.email || 'anonymous');
            if (result.success) {
                setRecommendedProducts(result.data.slice(0, limit));
            }
        } catch (error) {
            console.error('Failed to load recommendations:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
        );
    }

    if (recommendedProducts.length === 0) {
        return null;
    }

    return (
        <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Recommended For You</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedProducts.map(product => (
                    <div
                        key={product.id}
                        onClick={() => trackView(product.id)}
                        className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                    >
                        <div className="font-semibold text-gray-900 mb-1">
                            {product.title}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                            {product.region} • ${product.price}
                        </div>
                        <div className="text-xs text-gray-500">
                            {product.currentQuantity} / {product.targetQuantity} units
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">
                💡 Recommendations are personalized based on your activity
            </p>
        </div>
    );
};

export default RecommendedProducts;

