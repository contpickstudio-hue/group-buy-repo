import { useState } from 'react';
import { useCreateProduct } from '../stores';

/**
 * Custom hook for managing Create Group Buy form state and submission
 * Handles form data, validation, and submission logic
 */
const useCreateGroupBuyForm = () => {
    const createProduct = useCreateProduct();
    
    const [formData, setFormData] = useState({
        title: '',
        price: '',
        description: '',
        region: 'Toronto',
        targetQuantity: 20,
        deadline: '',
        imageDataUrl: ''
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
                deadline: formData.deadline,
                imageDataUrl: formData.imageDataUrl || null
            });

            if (result.success) {
                // Reset form on success
                setFormData({
                    title: '',
                    price: '',
                    description: '',
                    region: 'Toronto',
                    targetQuantity: 20,
                    deadline: '',
                    imageDataUrl: ''
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

    return {
        formData,
        isSubmitting,
        error,
        isFormValid,
        handleChange,
        handleSubmit
    };
};

export default useCreateGroupBuyForm;

