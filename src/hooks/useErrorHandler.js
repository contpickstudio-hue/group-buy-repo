import { useState, useCallback } from 'react';

/**
 * useFormHandler Hook
 * Handles form state, validation, and error handling
 */
export const useFormHandler = (initialValues = {}) => {
  const [values, setValues] = useState(initialValues);
  const [validationErrors, setValidationErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    
    // Clear general error
    if (error) {
      setError(null);
    }
  }, [validationErrors, error]);

  const handleBlur = useCallback((name) => {
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  }, []);

  const validate = useCallback((values, validationRules = {}) => {
    const errors = {};
    
    Object.keys(validationRules).forEach(field => {
      const rule = validationRules[field];
      const value = values[field];
      
      // Required validation
      if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        errors[field] = rule.message || `${field} is required`;
        return;
      }
      
      // Skip other validations if field is empty and not required
      if (!value) return;
      
      // Pattern validation
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors[field] = rule.message || `${field} is invalid`;
        return;
      }
      
      // Min length validation
      if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
        errors[field] = rule.message || `${field} must be at least ${rule.minLength} characters`;
        return;
      }
      
      // Max length validation
      if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
        errors[field] = rule.message || `${field} must be no more than ${rule.maxLength} characters`;
        return;
      }
      
      // Custom validation function
      if (rule.validate && typeof rule.validate === 'function') {
        const customError = rule.validate(value, values);
        if (customError) {
          errors[field] = customError;
        }
      }
    });
    
    return errors;
  }, []);

  const handleSubmit = useCallback(async (submitFn, validationRules = {}, options = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate if rules are provided
      if (Object.keys(validationRules).length > 0) {
        const errors = validate(values, validationRules);
        
        if (Object.keys(errors).length > 0) {
          setValidationErrors(errors);
          setIsLoading(false);
          return { success: false, error: 'Validation failed', errors };
        }
      }
      
      // Execute submit function
      const result = await submitFn(values);
      
      setIsLoading(false);
      return { success: true, ...result };
    } catch (err) {
      const errorMessage = err?.message || 'An error occurred';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  }, [values, validate]);

  const clearError = useCallback(() => {
    setError(null);
    setValidationErrors({});
  }, []);

  return {
    values,
    validationErrors,
    touched,
    isLoading,
    error,
    handleChange,
    handleBlur,
    handleSubmit,
    clearError
  };
};

