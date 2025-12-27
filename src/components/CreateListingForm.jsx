import React, { useState } from 'react';
import { useUser, useCreateListing, useCreateRegionalBatch, useAuthStore } from '../stores';
import { hasRole } from '../utils/authUtils';
import { Plus, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DateInput from './DateInput';

const CreateListingForm = () => {
    const user = useUser();
    const createListing = useCreateListing();
    const createRegionalBatch = useCreateRegionalBatch();
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        originLocation: '',
        imageDataUrl: '',
        imageColor: ''
    });
    
    const [batches, setBatches] = useState([
        {
            region: 'Toronto',
            price: '',
            minimumQuantity: 20,
            cutoffDate: '',
            deliveryMethod: 'pickup_point'
        }
    ]);
    
    // Guest users have NO roles - use hasRole for proper guest handling
    const loginMethod = useAuthStore((state) => state.loginMethod);
    if (!user || !hasRole(user, 'vendor', loginMethod)) {
        return null;
    }
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleBatchChange = (index, field, value) => {
        setBatches(prev => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                [field]: value
            };
            return updated;
        });
    };
    
    const addBatch = () => {
        setBatches(prev => [...prev, {
            region: 'Toronto',
            price: '',
            minimumQuantity: 20,
            cutoffDate: '',
            deliveryMethod: 'pickup_point'
        }]);
    };
    
    const removeBatch = (index) => {
        if (batches.length > 1) {
            setBatches(prev => prev.filter((_, i) => i !== index));
        } else {
            toast.error('At least one regional batch is required');
        }
    };
    
    const isFormValid = () => {
        if (!formData.title?.trim()) return false;
        if (!formData.originLocation?.trim()) return false;
        
        // Validate all batches
        for (const batch of batches) {
            if (!batch.region?.trim()) return false;
            if (!batch.price || parseFloat(batch.price) <= 0) return false;
            if (!batch.minimumQuantity || parseInt(batch.minimumQuantity) < 1) return false;
            if (!batch.cutoffDate) return false;
        }
        
        return true;
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        
        if (!isFormValid()) {
            setError('Please fill in all required fields');
            toast.error('Please fill in all required fields');
            return;
        }
        
        setIsSubmitting(true);
        const loadingToast = toast.loading('Creating listing...');
        
        try {
            // Create listing first
            const listingResult = await createListing({
                title: formData.title.trim(),
                description: formData.description.trim(),
                originLocation: formData.originLocation.trim(),
                imageDataUrl: formData.imageDataUrl || null,
                imageColor: formData.imageColor || null
            });
            
            if (!listingResult.success) {
                throw new Error(listingResult.error || 'Failed to create listing');
            }
            
            const listingId = listingResult.listingId || listingResult.listing?.id;
            
            if (!listingId) {
                throw new Error('Listing created but no ID returned');
            }
            
            // Create all regional batches
            const batchPromises = batches.map(batch => 
                createRegionalBatch(listingId, {
                    region: batch.region.trim(),
                    price: parseFloat(batch.price),
                    minimumQuantity: parseInt(batch.minimumQuantity),
                    cutoffDate: batch.cutoffDate,
                    deliveryMethod: batch.deliveryMethod
                })
            );
            
            const batchResults = await Promise.all(batchPromises);
            
            // Check if any batch creation failed
            const failedBatches = batchResults.filter(r => !r.success);
            if (failedBatches.length > 0) {
                console.error('Some batches failed to create:', failedBatches);
                toast.error(`${failedBatches.length} batch(es) failed to create`);
            }
            
            // Dismiss loading toast
            toast.dismiss(loadingToast);
            
            // Success
            toast.success('Listing created successfully! 🎉');
            
            // Reset form
            setFormData({
                title: '',
                description: '',
                originLocation: '',
                imageDataUrl: '',
                imageColor: ''
            });
            setBatches([{
                region: 'Toronto',
                price: '',
                minimumQuantity: 20,
                cutoffDate: '',
                deliveryMethod: 'pickup_point'
            }]);
            
        } catch (err) {
            toast.dismiss(loadingToast);
            const errorMessage = err.message || 'Failed to create listing';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-8 pb-24 sm:pb-8" data-testid="create-listing-form">
            <h3 className="text-xl font-semibold mb-4">Create Listing</h3>
            <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm">
                        {error}
                    </div>
                )}
                
                {/* Listing Info */}
                <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-800">Listing Information</h4>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                                Product Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="title"
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g., Premium Korean Strawberries"
                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="originLocation" className="block text-sm font-medium text-gray-700 mb-1">
                                Origin Location (Seller Location) <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="originLocation"
                                type="text"
                                name="originLocation"
                                value={formData.originLocation}
                                onChange={handleChange}
                                placeholder="e.g., Montreal"
                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
                                required
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Describe your product..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[88px]"
                        />
                    </div>
                </div>
                
                {/* Regional Batches */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-lg font-medium text-gray-800">Regional Batches</h4>
                        <button
                            type="button"
                            onClick={addBatch}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                            <Plus size={16} />
                            Add Batch
                        </button>
                    </div>
                    
                    {batches.map((batch, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-gray-700">Batch {index + 1}</h5>
                                {batches.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeBatch(index)}
                                        className="text-red-600 hover:text-red-800 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                        aria-label="Remove batch"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Region <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={batch.region}
                                        onChange={(e) => handleBatchChange(index, 'region', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
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
                                        Price for this Region ($) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={batch.price}
                                        onChange={(e) => handleBatchChange(index, 'price', e.target.value)}
                                        min="0.01"
                                        step="0.01"
                                        placeholder="38.00"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Minimum Quantity <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={batch.minimumQuantity}
                                        onChange={(e) => handleBatchChange(index, 'minimumQuantity', e.target.value)}
                                        min="1"
                                        placeholder="20"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Delivery Method <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={batch.deliveryMethod}
                                        onChange={(e) => handleBatchChange(index, 'deliveryMethod', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
                                        required
                                    >
                                        <option value="pickup_point">Pickup Point</option>
                                        <option value="direct_delivery">Direct Delivery</option>
                                    </select>
                                </div>
                                
                                <div className="md:col-span-2">
                                    <DateInput
                                        id={`cutoff-${index}`}
                                        name={`cutoff-${index}`}
                                        label="Cutoff Date"
                                        type="datetime-local"
                                        value={batch.cutoffDate}
                                        onChange={(e) => handleBatchChange(index, 'cutoffDate', e.target.value)}
                                        required
                                        min={new Date().toISOString().slice(0, 16)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={() => {
                            setFormData({
                                title: '',
                                description: '',
                                originLocation: '',
                                imageDataUrl: '',
                                imageColor: ''
                            });
                            setBatches([{
                                region: 'Toronto',
                                price: '',
                                minimumQuantity: 20,
                                cutoffDate: '',
                                deliveryMethod: 'pickup_point'
                            }]);
                            setError(null);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px] min-w-[44px]"
                        disabled={isSubmitting}
                    >
                        Reset
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !isFormValid()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 min-h-[44px] min-w-[44px] text-base"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Creating...
                            </>
                        ) : (
                            'Create Listing'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateListingForm;

