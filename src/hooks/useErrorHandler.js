import { useCallback, useState } from 'react';
import { 
    ErrorLogger, 
    showErrorToast, 
    showSuccessToast, 
    withErrorHandling,
    classifyError,
    getErrorMessage
} from '../services/errorService';
import { useSetCurrentScreen } from '../stores';

// Custom hook for error handling
export const useErrorHandler = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const setCurrentScreen = useSetCurrentScreen();
    
    // Handle async operations with error management
    const handleAsync = useCallback(async (
        operation, 
        {
            loadingMessage = null,
            successMessage = null,
            errorContext = '',
            showToast = true,
            redirectOnError = null,
            retryCount = 0
        } = {}
    ) => {
        setIsLoading(true);
        setError(null);
        
        if (loadingMessage && showToast) {
            // Could show loading toast here if needed
        }
        
        const result = await withErrorHandling(operation, {
            context: errorContext,
            showToast,
            retryCount
        });
        
        setIsLoading(false);
        
        if (result.success) {
            if (successMessage && showToast) {
                showSuccessToast(successMessage);
            }
            setError(null);
        } else {
            setError(result.error);
            
            // Handle specific error types
            const { type } = classifyError({ message: result.error });
            
            if (redirectOnError) {
                setTimeout(() => {
                    setCurrentScreen(redirectOnError);
                }, 2000);
            }
        }
        
        return result;
    }, [setCurrentScreen]);
    
    // Handle form submissions
    const handleFormSubmit = useCallback(async (
        submitFunction,
        {
            successMessage = 'Operation completed successfully',
            errorContext = 'Form submission',
            resetForm = null
        } = {}
    ) => {
        const result = await handleAsync(submitFunction, {
            successMessage,
            errorContext,
            showToast: true
        });
        
        if (result.success && resetForm) {
            resetForm();
        }
        
        return result;
    }, [handleAsync]);
    
    // Handle data loading
    const handleDataLoad = useCallback(async (
        loadFunction,
        {
            errorContext = 'Data loading',
            fallbackData = null,
            silent = false
        } = {}
    ) => {
        const result = await handleAsync(loadFunction, {
            errorContext,
            showToast: !silent,
            retryCount: 1
        });
        
        return result.success ? result.data : fallbackData;
    }, [handleAsync]);
    
    // Clear error state
    const clearError = useCallback(() => {
        setError(null);
    }, []);
    
    // Retry last operation
    const retry = useCallback((operation) => {
        return handleAsync(operation);
    }, [handleAsync]);
    
    // Report error to logging service
    const reportError = useCallback((error, context = {}) => {
        ErrorLogger.log(error, context);
    }, []);
    
    return {
        isLoading,
        error,
        handleAsync,
        handleFormSubmit,
        handleDataLoad,
        clearError,
        retry,
        reportError
    };
};

// Hook for API calls specifically
export const useApiHandler = () => {
    const errorHandler = useErrorHandler();
    
    const apiCall = useCallback(async (
        apiFunction,
        {
            method = 'GET',
            endpoint = '',
            successMessage = null,
            errorContext = `API ${method} ${endpoint}`,
            ...options
        } = {}
    ) => {
        return errorHandler.handleAsync(apiFunction, {
            successMessage,
            errorContext,
            retryCount: 2,
            ...options
        });
    }, [errorHandler]);
    
    return {
        ...errorHandler,
        apiCall
    };
};

// Hook for form handling
export const useFormHandler = (initialValues = {}) => {
    const [values, setValues] = useState(initialValues);
    const [touched, setTouched] = useState({});
    const [validationErrors, setValidationErrors] = useState({});
    const errorHandler = useErrorHandler();
    
    const handleChange = useCallback((name, value) => {
        setValues(prev => ({ ...prev, [name]: value }));
        
        // Clear validation error when user starts typing
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    }, [validationErrors]);
    
    const handleBlur = useCallback((name) => {
        setTouched(prev => ({ ...prev, [name]: true }));
    }, []);
    
    const validate = useCallback((validationRules) => {
        const errors = {};
        
        Object.entries(validationRules).forEach(([field, rules]) => {
            const value = values[field];
            
            if (rules.required && (!value || value.toString().trim() === '')) {
                errors[field] = `${field} is required`;
                return;
            }
            
            if (value && rules.minLength && value.length < rules.minLength) {
                errors[field] = `${field} must be at least ${rules.minLength} characters`;
                return;
            }
            
            if (value && rules.maxLength && value.length > rules.maxLength) {
                errors[field] = `${field} must be no more than ${rules.maxLength} characters`;
                return;
            }
            
            if (value && rules.pattern && !rules.pattern.test(value)) {
                errors[field] = rules.message || `${field} format is invalid`;
                return;
            }
            
            if (rules.custom) {
                const customError = rules.custom(value, values);
                if (customError) {
                    errors[field] = customError;
                }
            }
        });
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [values]);
    
    const handleSubmit = useCallback(async (
        submitFunction,
        validationRules = {},
        options = {}
    ) => {
        // Mark all fields as touched
        const allFields = Object.keys({ ...initialValues, ...values });
        setTouched(allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));
        
        // Validate form
        if (!validate(validationRules)) {
            showErrorToast(new Error('Please fix the form errors before submitting'));
            return { success: false, error: 'Validation failed' };
        }
        
        return errorHandler.handleFormSubmit(
            () => submitFunction(values),
            {
                errorContext: 'Form submission',
                resetForm: () => {
                    setValues(initialValues);
                    setTouched({});
                    setValidationErrors({});
                },
                ...options
            }
        );
    }, [values, initialValues, validate, errorHandler]);
    
    const reset = useCallback(() => {
        setValues(initialValues);
        setTouched({});
        setValidationErrors({});
        errorHandler.clearError();
    }, [initialValues, errorHandler]);
    
    return {
        values,
        touched,
        validationErrors,
        isLoading: errorHandler.isLoading,
        error: errorHandler.error,
        handleChange,
        handleBlur,
        handleSubmit,
        validate,
        reset,
        clearError: errorHandler.clearError
    };
};

// Hook for async data fetching with error handling
export const useAsyncData = (
    fetchFunction,
    dependencies = [],
    options = {}
) => {
    const [data, setData] = useState(options.initialData || null);
    const errorHandler = useErrorHandler();
    
    const fetchData = useCallback(async () => {
        const result = await errorHandler.handleDataLoad(
            fetchFunction,
            {
                errorContext: options.errorContext || 'Data fetching',
                silent: options.silent || false
            }
        );
        
        if (result !== null) {
            setData(result);
        }
        
        return result;
    }, [fetchFunction, errorHandler, options.errorContext, options.silent]);
    
    // Auto-fetch on mount and dependency changes
    React.useEffect(() => {
        if (options.autoFetch !== false) {
            fetchData();
        }
    }, dependencies);
    
    const refetch = useCallback(() => {
        return fetchData();
    }, [fetchData]);
    
    return {
        data,
        isLoading: errorHandler.isLoading,
        error: errorHandler.error,
        refetch,
        clearError: errorHandler.clearError
    };
};

export default useErrorHandler;
