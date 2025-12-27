import React from 'react';
import { MapPin, Clock, Package } from 'lucide-react';
import { t } from '../utils/translations';
import { EmptyStateWithAction } from './EmptyState';

/**
 * RegionSelector Component
 * Allows buyers to select a region and see region-specific pricing, progress, and cutoff info
 */
const RegionSelector = ({ 
    batches = [], 
    selectedBatchId, 
    onSelectBatch,
    listing 
}) => {
    if (!batches || batches.length === 0) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <EmptyStateWithAction 
                    type="batches"
                    message={t('regionSelector.noBatchesAvailable')}
                />
            </div>
        );
    }
    
    const selectedBatch = batches.find(b => b.id === selectedBatchId) || batches[0];
    const progress = selectedBatch.minimumQuantity > 0 
        ? Math.min((selectedBatch.currentQuantity / selectedBatch.minimumQuantity) * 100, 100)
        : 0;
    
    const cutoffDate = selectedBatch.cutoffDate ? new Date(selectedBatch.cutoffDate) : null;
    const now = new Date();
    const timeRemaining = cutoffDate ? Math.max(0, cutoffDate - now) : null;
    const daysRemaining = timeRemaining ? Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)) : null;
    
    return (
        <div className="space-y-4">
            {/* Region Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('regionSelector.selectRegion')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {batches.map((batch) => {
                        const isSelected = batch.id === selectedBatchId || (!selectedBatchId && batch.id === batches[0].id);
                        const batchProgress = batch.minimumQuantity > 0 
                            ? Math.min((batch.currentQuantity / batch.minimumQuantity) * 100, 100)
                            : 0;
                        
                        return (
                            <button
                                key={batch.id}
                                type="button"
                                onClick={() => onSelectBatch(batch.id)}
                                className={`p-4 border-2 rounded-lg text-left transition-all ${
                                    isSelected
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={18} className="text-gray-600" />
                                        <span className="font-semibold text-gray-900">{batch.region}</span>
                                    </div>
                                    <span className="text-lg font-bold text-blue-600">
                                        ${batch.price.toFixed(2)}
                                    </span>
                                </div>
                                
                                <div className="space-y-1 text-sm text-gray-600">
                                    <div className="flex items-center justify-between">
                                        <span>Progress:</span>
                                        <span className="font-medium">
                                            {batch.currentQuantity} / {batch.minimumQuantity}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all"
                                            style={{ width: `${batchProgress}%` }}
                                        />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
            
            {/* Selected Region Details */}
            {selectedBatch && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <MapPin size={18} />
                        {selectedBatch.region} - ${selectedBatch.price.toFixed(2)}
                    </h4>
                    
                    {/* Progress */}
                    <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">{t('regionSelector.demandProgress')}</span>
                            <span className="font-medium text-gray-900">
                                {selectedBatch.currentQuantity} / {selectedBatch.minimumQuantity} units
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className={`h-3 rounded-full transition-all ${
                                    progress >= 100 ? 'bg-green-600' : 'bg-blue-600'
                                }`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        {progress >= 100 && (
                            <p className="text-sm text-green-600 font-medium mt-1">
                                ✓ Minimum quantity reached!
                            </p>
                        )}
                    </div>
                    
                    {/* Cutoff Date */}
                    {cutoffDate && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock size={16} />
                            <span>
                                {daysRemaining !== null && daysRemaining > 0 ? (
                                    <>
                                        <strong className="text-gray-900">{daysRemaining}</strong> {daysRemaining !== 1 ? t('regionSelector.daysRemainingPlural', { count: daysRemaining }) : t('regionSelector.daysRemaining', { count: daysRemaining })}
                                        <span className="text-gray-500 ml-2">
                                            (until {cutoffDate.toLocaleDateString()})
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-red-600 font-medium">
                                        Cutoff date has passed
                                    </span>
                                )}
                            </span>
                        </div>
                    )}
                    
                    {/* Delivery Method */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Package size={16} />
                        <span>
                            Delivery: <strong className="text-gray-900">
                                {selectedBatch.deliveryMethod === 'pickup_point' 
                                    ? 'Pickup Point' 
                                    : 'Direct Delivery'}
                            </strong>
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegionSelector;

