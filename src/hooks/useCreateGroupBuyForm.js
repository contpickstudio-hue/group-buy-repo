import { useState } from 'react';
import { useCreateProduct, useUser, useAuthStore } from '../stores';
import { hasRole } from '../utils/authUtils';
import toast from 'react-hot-toast';

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
        imageDataUrl: '',
        latitude: null,
        longitude: null
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
            [name]: name === 'targetQuantity' || name === 'price' || name === 'latitude' || name === 'longitude' 
                ? (value === '' ? null : parseFloat(value) || null) 
                : value
        }));
        // Clear error when user starts typing
        if (error) setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Prevent duplicate submissions - early return with visual feedback
        if (isSubmitting) {
            toast.error('Please wait, submission in progress...', { duration: 2000 });
            return;
        }

        // Enforce vendor role at hook level - additional security check
        const user = useUser();
        if (!user || !hasRole(user, 'vendor')) {
            const errorMsg = 'Only users with vendor role can create group buys. Please upgrade your account.';
            setError(errorMsg);
            toast.error(errorMsg, { duration: 5000 });
            return;
        }
        
        setError(null);
        setIsSubmitting(true);

        // Show loading toast immediately for better feedback
        const loadingToast = toast.loading('Creating group buy...', { duration: 0 });

        // Validation
        if (!formData.title.trim()) {
            toast.dismiss(loadingToast);
            const errorMsg = 'Product title is required';
            setError(errorMsg);
            toast.error(errorMsg);
            setIsSubmitting(false);
            return;
        }
        if (!formData.price || formData.price <= 0) {
            toast.dismiss(loadingToast);
            const errorMsg = 'Price must be greater than 0';
            setError(errorMsg);
            toast.error(errorMsg);
            setIsSubmitting(false);
            return;
        }
        if (!formData.deadline) {
            toast.dismiss(loadingToast);
            const errorMsg = 'Deadline is required';
            setError(errorMsg);
            toast.error(errorMsg);
            setIsSubmitting(false);
            return;
        }
        if (formData.targetQuantity < 5) {
            toast.dismiss(loadingToast);
            const errorMsg = 'Target quantity must be at least 5';
            setError(errorMsg);
            toast.error(errorMsg);
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
                imageDataUrl: formData.imageDataUrl || null,
                latitude: formData.latitude || null,
                longitude: formData.longitude || null
            });

            // Dismiss loading toast
            toast.dismiss(loadingToast);

            if (result && result.success) {
                // Reset form on success
                setFormData({
                    title: '',
                    price: '',
                    description: '',
                    region: 'Toronto',
                    targetQuantity: 20,
                    deadline: '',
                    imageDataUrl: '',
                    latitude: null,
                    longitude: null
                });
                // Clear any previous errors
                setError(null);
                // Show success toast
                toast.success('Group buy created successfully! 🎉', { duration: 4000 });
            } else {
                // Handle failure case
                const errorMessage = result?.error || 'Failed to create group buy. Please try again.';
                setError(errorMessage);
                toast.error(errorMessage, { duration: 5000 });
            }
        } catch (err) {
            // Dismiss loading toast on error
            toast.dismiss(loadingToast);
            
            const errorMessage = err?.message || err?.toString() || 'An unexpected error occurred';
            setError(errorMessage);
            toast.error(`Error: ${errorMessage}`, { duration: 5000 });
            console.error('Group buy creation error:', err);
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

