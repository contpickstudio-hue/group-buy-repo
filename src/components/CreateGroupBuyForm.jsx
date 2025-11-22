import React, { useState } from 'react';
import { useUser, useCreateProduct } from '../stores';

const CreateGroupBuyForm = () => {
    const user = useUser();
    const createProduct = useCreateProduct();
    
    const [formData, setFormData] = useState({
        title: '',
        price: '',
        description: '',
        region: 'Toronto',
        targetQuantity: 20,
        deadline: ''
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Check if form is valid (required fields: title, price, region)
    const isFormValid = formData.title.trim() !== '' && 
                       formData.price !== '' && 
                       formData.price > 0 && 
                       formData.region !== '';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'targetQuantity' || name === 'price' ? parseFloat(value) || '' : value
        }));
        // Clear error when user starts typing
        if (error) setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        // Validation
        if (!formData.title.trim()) {
            setError('Product title is required');
            setIsSubmitting(false);
            return;
        }
        if (!formData.price || formData.price <= 0) {
            setError('Price must be greater than 0');
            setIsSubmitting(false);
            return;
        }
        if (!formData.deadline) {
            setError('Deadline is required');
            setIsSubmitting(false);
            return;
        }
        if (formData.targetQuantity < 5) {
            setError('Target quantity must be at least 5');
            setIsSubmitting(false);
            return;
        }

        try {
            const result = await createProduct({
                title: formData.title.trim(),
                price: formData.price,
                description: formData.description.trim(),
                region: formData.region,
                targetQuantity: formData.targetQuantity,
                deadline: formData.deadline
            });

            if (result.success) {
                // Reset form on success
                setFormData({
                    title: '',
                    price: '',
                    description: '',
                    region: 'Toronto',
                    targetQuantity: 20,
                    deadline: ''
                });
            } else {
                setError(result.error || 'Failed to create group buy');
            }
        } catch (err) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user || !user.roles?.includes('vendor')) {
        return null;
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8" data-testid="create-product-form">
            <h3 className="text-xl font-semibold mb-4">Create Group Buy</h3>
            <form className="space-y-4" onSubmit={handleSubmit}>
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm">
                        {error}
                    </div>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                            Product Title
                        </label>
                        <input
                            id="title"
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g., Premium Korean Strawberries"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                            Price per Unit ($)
                        </label>
                        <input
                            id="price"
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            min="1"
                            step="0.01"
                            placeholder="38"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                            Region
                        </label>
                        <select 
                            id="region"
                            name="region"
                            value={formData.region}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="Toronto">Toronto</option>
                            <option value="Hamilton">Hamilton</option>
                            <option value="Niagara">Niagara</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="targetQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                            Target Quantity
                        </label>
                        <input
                            id="targetQuantity"
                            type="number"
                            name="targetQuantity"
                            value={formData.targetQuantity}
                            onChange={handleChange}
                            min="5"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                            Deadline
                        </label>
                        <input
                            id="deadline"
                            type="date"
                            name="deadline"
                            value={formData.deadline}
                            onChange={handleChange}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting || !isFormValid}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Creating...' : 'Create Group Buy'}
                </button>
            </form>
        </div>
    );
};

export default CreateGroupBuyForm;

