import * as Sentry from '@sentry/react';
import toast from 'react-hot-toast';

// Error types for categorization
export const ErrorTypes = {
    NETWORK: 'NETWORK_ERROR',
    AUTHENTICATION: 'AUTH_ERROR',
    VALIDATION: 'VALIDATION_ERROR',
    PERMISSION: 'PERMISSION_ERROR',
    NOT_FOUND: 'NOT_FOUND_ERROR',
    SERVER: 'SERVER_ERROR',
    CLIENT: 'CLIENT_ERROR',
    UNKNOWN: 'UNKNOWN_ERROR'
};

// Error severity levels
export const ErrorSeverity = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

// Initialize Sentry (in production)
export const initializeErrorTracking = () => {
    if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
        Sentry.init({
            dsn: import.meta.env.VITE_SENTRY_DSN,
            environment: import.meta.env.MODE,
            tracesSampleRate: 0.1,
            beforeSend(event) {
                // Filter out development errors
                if (event.environment === 'development') {
                    return null;
                }
                return event;
            }
        });
    }
};

// Error classification helper
export const classifyError = (error) => {
    if (!error) return { type: ErrorTypes.UNKNOWN, severity: ErrorSeverity.LOW };
    
    const message = error.message?.toLowerCase() || '';
    const status = error.status || error.code;
    
    // Network errors
    if (message.includes('network') || message.includes('fetch') || status === 'NETWORK_ERROR') {
        return { type: ErrorTypes.NETWORK, severity: ErrorSeverity.MEDIUM };
    }
    
    // Authentication errors
    if (status === 401 || message.includes('unauthorized') || message.includes('authentication')) {
        return { type: ErrorTypes.AUTHENTICATION, severity: ErrorSeverity.HIGH };
    }
    
    // Permission errors
    if (status === 403 || message.includes('forbidden') || message.includes('permission')) {
        return { type: ErrorTypes.PERMISSION, severity: ErrorSeverity.HIGH };
    }
    
    // Not found errors
    if (status === 404 || message.includes('not found')) {
        return { type: ErrorTypes.NOT_FOUND, severity: ErrorSeverity.MEDIUM };
    }
    
    // Validation errors
    if (status === 400 || message.includes('validation') || message.includes('invalid')) {
        return { type: ErrorTypes.VALIDATION, severity: ErrorSeverity.LOW };
    }
    
    // Server errors
    if (status >= 500 || message.includes('server error') || message.includes('internal')) {
        return { type: ErrorTypes.SERVER, severity: ErrorSeverity.HIGH };
    }
    
    // Client errors
    if (status >= 400 && status < 500) {
        return { type: ErrorTypes.CLIENT, severity: ErrorSeverity.MEDIUM };
    }
    
    return { type: ErrorTypes.UNKNOWN, severity: ErrorSeverity.MEDIUM };
};

// User-friendly error messages
export const getErrorMessage = (error, context = '') => {
    const { type } = classifyError(error);
    
    const messages = {
        [ErrorTypes.NETWORK]: {
            title: 'Connection Problem',
            message: 'Please check your internet connection and try again.',
            action: 'Retry'
        },
        [ErrorTypes.AUTHENTICATION]: {
            title: 'Authentication Required',
            message: 'Please sign in to continue.',
            action: 'Sign In'
        },
        [ErrorTypes.PERMISSION]: {
            title: 'Access Denied',
            message: 'You don\'t have permission to perform this action.',
            action: 'Contact Support'
        },
        [ErrorTypes.NOT_FOUND]: {
            title: 'Not Found',
            message: 'The requested item could not be found.',
            action: 'Go Back'
        },
        [ErrorTypes.VALIDATION]: {
            title: 'Invalid Input',
            message: 'Please check your input and try again.',
            action: 'Fix Input'
        },
        [ErrorTypes.SERVER]: {
            title: 'Server Error',
            message: 'Something went wrong on our end. Please try again later.',
            action: 'Try Again'
        },
        [ErrorTypes.CLIENT]: {
            title: 'Request Error',
            message: 'There was a problem with your request.',
            action: 'Try Again'
        },
        [ErrorTypes.UNKNOWN]: {
            title: 'Something Went Wrong',
            message: 'An unexpected error occurred. Please try again.',
            action: 'Try Again'
        }
    };
    
    const baseMessage = messages[type] || messages[ErrorTypes.UNKNOWN];
    
    // Add context if provided
    if (context) {
        return {
            ...baseMessage,
            message: `${context}: ${baseMessage.message}`
        };
    }
    
    return baseMessage;
};

// Error logging service
export class ErrorLogger {
    static log(error, context = {}) {
        const { type, severity } = classifyError(error);
        
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            type,
            severity,
            context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Console logging for development
        if (import.meta.env.DEV) {
            console.group(`🚨 ${severity.toUpperCase()} ERROR: ${type}`);
            console.error('Error:', error);
            console.log('Context:', context);
            console.log('Classification:', { type, severity });
            console.groupEnd();
        }
        
        // Send to Sentry in production
        if (import.meta.env.PROD) {
            Sentry.withScope((scope) => {
                scope.setTag('errorType', type);
                scope.setLevel(severity);
                scope.setContext('errorContext', context);
                Sentry.captureException(error);
            });
        }
        
        // Store in local storage for debugging (keep last 50 errors)
        try {
            const storedErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
            storedErrors.unshift(errorInfo);
            localStorage.setItem('app_errors', JSON.stringify(storedErrors.slice(0, 50)));
        } catch (e) {
            // Ignore localStorage errors
        }
        
        return errorInfo;
    }
    
    static getStoredErrors() {
        try {
            return JSON.parse(localStorage.getItem('app_errors') || '[]');
        } catch (e) {
            return [];
        }
    }
    
    static clearStoredErrors() {
        localStorage.removeItem('app_errors');
    }
}

// Toast notification helpers
export const showErrorToast = (error, context = '') => {
    const errorMessage = getErrorMessage(error, context);
    
    return toast.error(errorMessage.message, {
        duration: 5000,
        position: 'top-right',
        style: {
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626'
        },
        icon: '❌'
    });
};

export const showSuccessToast = (message, options = {}) => {
    return toast.success(message, {
        duration: 3000,
        position: 'top-right',
        style: {
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            color: '#16A34A'
        },
        icon: '✅',
        ...options
    });
};

export const showWarningToast = (message, options = {}) => {
    return toast(message, {
        duration: 4000,
        position: 'top-right',
        style: {
            background: '#FFFBEB',
            border: '1px solid #FED7AA',
            color: '#D97706'
        },
        icon: '⚠️',
        ...options
    });
};

export const showInfoToast = (message, options = {}) => {
    return toast(message, {
        duration: 3000,
        position: 'top-right',
        style: {
            background: '#EFF6FF',
            border: '1px solid #DBEAFE',
            color: '#2563EB'
        },
        icon: 'ℹ️',
        ...options
    });
};

// Async operation wrapper with error handling
export const withErrorHandling = async (
    operation, 
    {
        context = '',
        showToast = true,
        logError = true,
        fallbackValue = null,
        retryCount = 0,
        retryDelay = 1000
    } = {}
) => {
    let lastError;
    
    for (let attempt = 0; attempt <= retryCount; attempt++) {
        try {
            const result = await operation();
            
            // Show success toast if this was a retry
            if (attempt > 0 && showToast) {
                showSuccessToast('Operation completed successfully');
            }
            
            return { success: true, data: result, error: null };
        } catch (error) {
            lastError = error;
            
            // Log error
            if (logError) {
                ErrorLogger.log(error, { 
                    context, 
                    attempt: attempt + 1, 
                    maxAttempts: retryCount + 1 
                });
            }
            
            // If we have more retries, wait and continue
            if (attempt < retryCount) {
                await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
                continue;
            }
            
            // Final attempt failed
            if (showToast) {
                showErrorToast(error, context);
            }
            
            return { 
                success: false, 
                data: fallbackValue, 
                error: error.message || 'An unexpected error occurred' 
            };
        }
    }
};

// API call wrapper with standardized error handling
export const apiCall = async (apiFunction, options = {}) => {
    return withErrorHandling(apiFunction, {
        context: 'API Request',
        retryCount: 2,
        retryDelay: 1000,
        ...options
    });
};

// Form submission wrapper
export const handleFormSubmission = async (submitFunction, options = {}) => {
    return withErrorHandling(submitFunction, {
        context: 'Form Submission',
        showToast: true,
        ...options
    });
};

// Data loading wrapper
export const loadData = async (loadFunction, options = {}) => {
    return withErrorHandling(loadFunction, {
        context: 'Data Loading',
        showToast: false, // Don't show toast for data loading errors
        fallbackValue: [],
        ...options
    });
};

// Error recovery helpers
export const createRetryHandler = (operation, maxRetries = 3) => {
    let retryCount = 0;
    
    const retry = async () => {
        try {
            return await operation();
        } catch (error) {
            retryCount++;
            
            if (retryCount <= maxRetries) {
                showWarningToast(`Retrying... (${retryCount}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                return retry();
            } else {
                throw error;
            }
        }
    };
    
    return retry;
};

// Network status monitoring
export class NetworkMonitor {
    static isOnline = navigator.onLine;
    static listeners = new Set();
    
    static init() {
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));
    }
    
    static handleOnline() {
        this.isOnline = true;
        showSuccessToast('Connection restored');
        this.notifyListeners(true);
    }
    
    static handleOffline() {
        this.isOnline = false;
        showWarningToast('Connection lost. Some features may not work.');
        this.notifyListeners(false);
    }
    
    static addListener(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }
    
    static notifyListeners(isOnline) {
        this.listeners.forEach(callback => callback(isOnline));
    }
}

// Initialize network monitoring
NetworkMonitor.init();

export default {
    ErrorLogger,
    classifyError,
    getErrorMessage,
    showErrorToast,
    showSuccessToast,
    showWarningToast,
    showInfoToast,
    withErrorHandling,
    apiCall,
    handleFormSubmission,
    loadData,
    createRetryHandler,
    NetworkMonitor
};
