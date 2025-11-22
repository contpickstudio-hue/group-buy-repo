import React, { useEffect, useState } from 'react';
import { useProductsRealtime } from '../hooks/useRealtime';
import { useStore } from '../stores';
import { Package, Users, Clock, Zap, TrendingUp } from 'lucide-react';

/**
 * Enhanced product list component with real-time updates
 */
const RealtimeProductList = ({ filters = {}, className = '' }) => {
  const [newProductIds, setNewProductIds] = useState(new Set());
  const [updatedProductIds, setUpdatedProductIds] = useState(new Set());
  
  const { products, loading, loadProducts } = useStore((state) => ({
    products: state.product?.products || [],
    loading: state.product?.loading || false,
    loadProducts: state.product?.loadProducts || (() => {}),
  }));

  // Set up real-time subscription with custom handlers
  const { isSubscribed } = useProductsRealtime({
    onInsert: (newProduct) => {
      console.log('New product added:', newProduct);
      
      // Add visual indicator for new product
      setNewProductIds(prev => new Set([...prev, newProduct.id]));
      
      // Remove indicator after animation
      setTimeout(() => {
        setNewProductIds(prev => {
          const updated = new Set(prev);
          updated.delete(newProduct.id);
          return updated;
        });
      }, 3000);
      
      // Refresh product list to include new product
      loadProducts(filters);
    },
    
    onUpdate: (updatedProduct, oldProduct) => {
      console.log('Product updated:', updatedProduct);
      
      // Add visual indicator for updated product
      setUpdatedProductIds(prev => new Set([...prev, updatedProduct.id]));
      
      // Remove indicator after animation
      setTimeout(() => {
        setUpdatedProductIds(prev => {
          const updated = new Set(prev);
          updated.delete(updatedProduct.id);
          return updated;
        });
      }, 2000);
      
      // Refresh product list to show updates
      loadProducts(filters);
    },
    
    onDelete: (deletedProduct) => {
      console.log('Product deleted:', deletedProduct);
      
      // Refresh product list to remove deleted product
      loadProducts(filters);
    },
  });

  // Load initial products
  useEffect(() => {
    loadProducts(filters);
  }, [loadProducts, filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading products...</span>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center p-8">
        <Package size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg">No products available</p>
        <p className="text-gray-400 text-sm">
          {isSubscribed ? 'Waiting for new products...' : 'Real-time updates unavailable'}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Real-time status indicator */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Group Buy Products ({products.length})
        </h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isSubscribed ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-600">
            {isSubscribed ? 'Live updates' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isNew={newProductIds.has(product.id)}
            isUpdated={updatedProductIds.has(product.id)}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Individual product card with real-time visual indicators
 */
const ProductCard = ({ product, isNew = false, isUpdated = false }) => {
  const [participantChange, setParticipantChange] = useState(null);
  
  const { joinGroupBuy } = useStore((state) => ({
    joinGroupBuy: state.product?.joinGroupBuy || (() => {}),
  }));

  // Track participant changes for animations
  useEffect(() => {
    if (isUpdated) {
      setParticipantChange('increased');
      const timer = setTimeout(() => setParticipantChange(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [isUpdated]);

  const progressPercentage = Math.min(
    (product.current_participants / product.min_participants) * 100,
    100
  );

  const isGoalReached = product.current_participants >= product.min_participants;
  const timeLeft = product.deadline ? new Date(product.deadline) - new Date() : null;
  const daysLeft = timeLeft ? Math.ceil(timeLeft / (1000 * 60 * 60 * 24)) : null;

  const handleJoin = async () => {
    try {
      await joinGroupBuy(product.id);
    } catch (error) {
      console.error('Failed to join group buy:', error);
    }
  };

  return (
    <div className={`
      bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg
      ${isNew ? 'ring-2 ring-green-500 animate-pulse' : ''}
      ${isUpdated ? 'ring-2 ring-blue-500' : ''}
    `}>
      {/* New product badge */}
      {isNew && (
        <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 flex items-center">
          <Zap size={12} className="mr-1" />
          NEW!
        </div>
      )}

      {/* Product image */}
      <div className="relative h-48 bg-gray-200">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package size={48} className="text-gray-400" />
          </div>
        )}
        
        {/* Goal reached badge */}
        {isGoalReached && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            Goal Reached!
          </div>
        )}
      </div>

      {/* Product details */}
      <div className="p-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h4>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

        {/* Price and vendor */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-2xl font-bold text-blue-600">${product.price}</span>
          <span className="text-sm text-gray-500">by {product.vendor}</span>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">Progress</span>
            <span className={`text-sm font-medium ${participantChange ? 'animate-bounce text-green-600' : 'text-gray-900'}`}>
              {product.current_participants}/{product.min_participants}
              {participantChange && (
                <TrendingUp size={12} className="inline ml-1 text-green-600" />
              )}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                isGoalReached ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Time remaining */}
        {daysLeft !== null && (
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <Clock size={14} className="mr-1" />
            {daysLeft > 0 ? `${daysLeft} days left` : 'Ending soon'}
          </div>
        )}

        {/* Join button */}
        <button
          onClick={handleJoin}
          disabled={isGoalReached}
          className={`
            w-full py-2 px-4 rounded-lg font-medium transition-colors
            ${isGoalReached
              ? 'bg-green-100 text-green-800 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          {isGoalReached ? 'Goal Reached!' : 'Join Group Buy'}
        </button>
      </div>
    </div>
  );
};

/**
 * Real-time activity feed for products
 */
export const ProductActivityFeed = ({ limit = 5 }) => {
  const [activities, setActivities] = useState([]);
  
  const { addNotification } = useStore((state) => ({
    addNotification: state.ui?.addNotification || (() => {}),
  }));

  // Subscribe to product changes and track activity
  useProductsRealtime({
    onInsert: (newProduct) => {
      const activity = {
        id: `activity_${Date.now()}`,
        type: 'product_created',
        message: `New group buy: ${newProduct.name}`,
        timestamp: new Date().toISOString(),
        data: newProduct,
      };
      
      setActivities(prev => [activity, ...prev.slice(0, limit - 1)]);
    },
    
    onUpdate: (updatedProduct, oldProduct) => {
      if (updatedProduct.current_participants > oldProduct.current_participants) {
        const activity = {
          id: `activity_${Date.now()}`,
          type: 'participant_joined',
          message: `Someone joined "${updatedProduct.name}"`,
          timestamp: new Date().toISOString(),
          data: updatedProduct,
        };
        
        setActivities(prev => [activity, ...prev.slice(0, limit - 1)]);
      }
      
      if (updatedProduct.current_participants >= updatedProduct.min_participants && 
          oldProduct.current_participants < oldProduct.min_participants) {
        const activity = {
          id: `activity_${Date.now()}`,
          type: 'goal_reached',
          message: `"${updatedProduct.name}" reached its goal!`,
          timestamp: new Date().toISOString(),
          data: updatedProduct,
        };
        
        setActivities(prev => [activity, ...prev.slice(0, limit - 1)]);
      }
    },
  });

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <p className="text-gray-500 text-center">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
            <div className="flex-shrink-0 mt-1">
              {activity.type === 'product_created' && <Package size={16} className="text-blue-500" />}
              {activity.type === 'participant_joined' && <Users size={16} className="text-green-500" />}
              {activity.type === 'goal_reached' && <TrendingUp size={16} className="text-purple-500" />}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">{activity.message}</p>
              <p className="text-xs text-gray-500">
                {new Date(activity.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RealtimeProductList;
