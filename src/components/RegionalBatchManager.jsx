import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, X, Plus, Package, Clock, TrendingUp, Play } from 'lucide-react';
import { useGetBatchesByListing, useCancelRegionalBatch, useCreateRegionalBatch, useActivateRegionalBatch } from '../stores';
import toast from 'react-hot-toast';
import DateInput from './DateInput';
import { EmptyStateWithAction } from './EmptyState';
import { t } from '../utils/translations';

/**
 * RegionalBatchManager Component
 * Seller dashboard component for managing regional batches
 */
const RegionalBatchManager = ({ listingId, onBatchAdded }) => {
    const getBatchesByListing = useGetBatchesByListing();
    const cancelRegionalBatch = useCancelRegionalBatch();
    const createRegionalBatch = useCreateRegionalBatch();
    const activateRegionalBatch = useActivateRegionalBatch();
    
    const [expandedBatches, setExpandedBatches] = useState(new Set());
    const [showAddBatch, setShowAddBatch] = useState(false);
    const [isCancelling, setIsCancelling] = useState(null);
    const [isActivating, setIsActivating] = useState(null);
    
    const batches = getBatchesByListing(listingId) || [];
    
    const [newBatch, setNewBatch] = useState({
        region: 'Toronto',
        price: '',
        minimumQuantity: 20,
        cutoffDate: '',
        deliveryMethod: 'pickup_point'
    });
    
    const toggleBatch = (batchId) => {
        setExpandedBatches(prev => {
            const next = new Set(prev);
            if (next.has(batchId)) {
                next.delete(batchId);
            } else {
                next.add(batchId);
            }
            return next;
        });
    };
    
    const handleCancelBatch = async (batchId) => {
        if (!window.confirm('Are you sure you want to cancel this batch? Orders will be flagged for refund.')) {
            return;
        }
        
        setIsCancelling(batchId);
        try {
            const result = await cancelRegionalBatch(batchId);
            if (result.success) {
                toast.success('Batch cancelled successfully. Orders flagged for refund.');
            } else {
                throw new Error(result.error || 'Failed to cancel batch');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to cancel batch');
        } finally {
            setIsCancelling(null);
        }
    };
    
    const handleAddBatch = async (e) => {
        e.preventDefault();
        
        if (!newBatch.region || !newBatch.price || !newBatch.minimumQuantity || !newBatch.cutoffDate) {
            toast.error('Please fill in all required fields');
            return;
        }
        
        try {
            const result = await createRegionalBatch(listingId, {
                region: newBatch.region.trim(),
                price: parseFloat(newBatch.price),
                minimumQuantity: parseInt(newBatch.minimumQuantity),
                cutoffDate: newBatch.cutoffDate,
                deliveryMethod: newBatch.deliveryMethod
            });
            
            if (result.success) {
                toast.success('Regional batch added successfully!');
                setNewBatch({
                    region: 'Toronto',
                    price: '',
                    minimumQuantity: 20,
                    cutoffDate: '',
                    deliveryMethod: 'pickup_point'
                });
                setShowAddBatch(false);
                if (onBatchAdded) {
                    onBatchAdded();
                }
            } else {
                throw new Error(result.error || 'Failed to add batch');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to add batch');
        }
    };
    
    const handleActivateBatch = async (batchId) => {
        setIsActivating(batchId);
        try {
            const result = await activateRegionalBatch(batchId);
            if (result.success) {
                toast.success('Batch activated successfully! It is now accepting orders.');
            } else {
                throw new Error(result.error || 'Failed to activate batch');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to activate batch');
        } finally {
            setIsActivating(null);
        }
    };
    
    const getStatusColor = (status) => {
        switch (status) {
            case 'draft':
                return 'bg-yellow-100 text-yellow-800';
            case 'active':
                return 'bg-blue-100 text-blue-800';
            case 'successful':
                return 'bg-green-100 text-green-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'cancelled':
                return 'bg-gray-100 text-gray-800';
            case 'delivered':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    
    const getStatusLabel = (status) => {
        switch (status) {
            case 'draft':
                return 'Draft';
            case 'active':
                return 'Active';
            case 'successful':
                return 'Successful';
            case 'failed':
                return 'Failed';
            case 'cancelled':
                return 'Cancelled';
            case 'delivered':
                return 'Delivered';
            default:
                return status;
        }
    };
    
    if (batches.length === 0) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <EmptyStateWithAction 
                    type="batches"
                    message="No regional batches yet"
                />
            </div>
        );
    }
    
    return (
        <div className="space-y-3">
            {batches.map((batch) => {
                const isExpanded = expandedBatches.has(batch.id);
                const progress = batch.minimumQuantity > 0 
                    ? Math.min((batch.currentQuantity / batch.minimumQuantity) * 100, 100)
                    : 0;
                const cutoffDate = batch.cutoffDate ? new Date(batch.cutoffDate) : null;
                const now = new Date();
                const daysRemaining = cutoffDate ? Math.ceil((cutoffDate - now) / (1000 * 60 * 60 * 24)) : null;
                
                return (
                    <div key={batch.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Batch Header */}
                        <div className="bg-white p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="font-semibold text-gray-900">{batch.region}</h4>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                                            {getStatusLabel(batch.status)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span className="font-medium text-gray-900">${batch.price.toFixed(2)}</span>
                                        <span className="flex items-center gap-1">
                                            <TrendingUp size={14} />
                                            {batch.currentQuantity} / {batch.minimumQuantity} units
                                        </span>
                                        {cutoffDate && (
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {daysRemaining !== null && daysRemaining > 0 
                                                    ? `${daysRemaining}d left`
                                                    : 'Expired'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {batch.status === 'draft' && (
                                        <button
                                            onClick={() => handleActivateBatch(batch.id)}
                                            disabled={isActivating === batch.id}
                                            className="px-3 py-1 text-sm bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 flex items-center gap-1"
                                        >
                                            <Play size={14} />
                                            {isActivating === batch.id ? 'Activating...' : 'Activate'}
                                        </button>
                                    )}
                                    {batch.status === 'active' && (
                                        <button
                                            onClick={() => handleCancelBatch(batch.id)}
                                            disabled={isCancelling === batch.id}
                                            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                                        >
                                            {isCancelling === batch.id ? 'Cancelling...' : 'Cancel'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => toggleBatch(batch.id)}
                                        className="p-1 text-gray-600 hover:text-gray-900"
                                    >
                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </button>
                                </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="mt-3">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all ${
                                            progress >= 100 ? 'bg-green-600' : 'bg-blue-600'
                                        }`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {/* Expanded Details */}
                        {isExpanded && (
                            <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Region:</span>
                                        <span className="ml-2 font-medium text-gray-900">{batch.region}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Price:</span>
                                        <span className={`ml-2 font-medium ${
                                            batch.status !== 'draft' ? 'text-gray-900' : 'text-gray-900'
                                        }`}>
                                            ${batch.price.toFixed(2)}
                                            {batch.status !== 'draft' && (
                                                <span className="ml-2 text-xs text-gray-500">(Locked)</span>
                                            )}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Minimum Quantity:</span>
                                        <span className="ml-2 font-medium text-gray-900">{batch.minimumQuantity}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Current Quantity:</span>
                                        <span className="ml-2 font-medium text-gray-900">{batch.currentQuantity}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Delivery Method:</span>
                                        <span className="ml-2 font-medium text-gray-900 flex items-center gap-1">
                                            <Package size={14} />
                                            {batch.deliveryMethod === 'pickup_point' ? 'Pickup Point' : 'Direct Delivery'}
                                        </span>
                                    </div>
                                    {cutoffDate && (
                                        <div>
                                            <span className="text-gray-600">Cutoff Date:</span>
                                            <span className="ml-2 font-medium text-gray-900">
                                                {cutoffDate.toLocaleDateString()} {cutoffDate.toLocaleTimeString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
            
            {/* Add Batch Form */}
            {showAddBatch && (
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">Add New Regional Batch</h4>
                        <button
                            onClick={() => {
                                setShowAddBatch(false);
                                setNewBatch({
                                    region: 'Toronto',
                                    price: '',
                                    minimumQuantity: 20,
                                    cutoffDate: '',
                                    deliveryMethod: 'pickup_point'
                                });
                            }}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleAddBatch} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Region <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={newBatch.region}
                                    onChange={(e) => setNewBatch(prev => ({ ...prev, region: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    required
                                >
                                    <option value="Toronto">Toronto</option>
                                    <option value="Hamilton">Hamilton</option>
                                    <option value="Mississauga">Mississauga</option>
                                    <option value="Ottawa">Ottawa</option>
                                    <option value="Vancouver">Vancouver</option>
                                    <option value="Montreal">Montreal</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Price ($) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={newBatch.price}
                                    onChange={(e) => setNewBatch(prev => ({ ...prev, price: e.target.value }))}
                                    min="0.01"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Minimum Quantity <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={newBatch.minimumQuantity}
                                    onChange={(e) => setNewBatch(prev => ({ ...prev, minimumQuantity: e.target.value }))}
                                    min="1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Delivery Method <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={newBatch.deliveryMethod}
                                    onChange={(e) => setNewBatch(prev => ({ ...prev, deliveryMethod: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    required
                                >
                                    <option value="pickup_point">Pickup Point</option>
                                    <option value="direct_delivery">Direct Delivery</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <DateInput
                                id="new-batch-cutoff"
                                name="cutoffDate"
                                label="Cutoff Date"
                                type="datetime-local"
                                value={newBatch.cutoffDate}
                                onChange={(e) => setNewBatch(prev => ({ ...prev, cutoffDate: e.target.value }))}
                                required
                                min={new Date().toISOString().slice(0, 16)}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddBatch(false);
                                    setNewBatch({
                                        region: 'Toronto',
                                        price: '',
                                        minimumQuantity: 20,
                                        cutoffDate: '',
                                        deliveryMethod: 'pickup_point'
                                    });
                                }}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Add Batch
                            </button>
                        </div>
                    </form>
                </div>
            )}
            
            {/* Add Batch Button */}
            {!showAddBatch && (
                <button
                    onClick={() => setShowAddBatch(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                    <Plus size={18} />
                    Add Regional Batch
                </button>
            )}
        </div>
    );
};

export default RegionalBatchManager;

