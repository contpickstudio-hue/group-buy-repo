import { vi } from 'vitest';

// Mock error types and severity
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

export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Mock error tracking initialization
export const initializeErrorTracking = vi.fn();

// Mock error classification
export const classifyError = vi.fn().mockReturnValue({
  type: ErrorTypes.UNKNOWN,
  severity: ErrorSeverity.MEDIUM
});

// Mock error message generation
export const getErrorMessage = vi.fn().mockReturnValue({
  title: 'Something Went Wrong',
  message: 'An unexpected error occurred.',
  action: 'Try Again'
});

// Mock error logger
export const ErrorLogger = {
  log: vi.fn(),
  getStoredErrors: vi.fn().mockReturnValue([]),
  clearStoredErrors: vi.fn(),
};

// Mock toast functions
export const showErrorToast = vi.fn();
export const showSuccessToast = vi.fn();
export const showWarningToast = vi.fn();
export const showInfoToast = vi.fn();

// Mock error handling wrapper
export const withErrorHandling = vi.fn().mockImplementation(async (operation, options = {}) => {
  try {
    const result = await operation();
    return { success: true, data: result, error: null };
  } catch (error) {
    ErrorLogger.log(error, options.context || {});
    if (options.showToast) {
      showErrorToast(error, options.context);
    }
    return { 
      success: false, 
      data: options.fallbackValue || null, 
      error: error.message 
    };
  }
});

// Mock API call wrapper
export const apiCall = vi.fn().mockImplementation(async (apiFunction, options = {}) => {
  return withErrorHandling(apiFunction, {
    context: 'API Request',
    retryCount: 2,
    retryDelay: 1000,
    ...options
  });
});

// Mock form submission wrapper
export const handleFormSubmission = vi.fn().mockImplementation(async (submitFunction, options = {}) => {
  return withErrorHandling(submitFunction, {
    context: 'Form Submission',
    showToast: true,
    ...options
  });
});

// Mock data loading wrapper
export const loadData = vi.fn().mockImplementation(async (loadFunction, options = {}) => {
  return withErrorHandling(loadFunction, {
    context: 'Data Loading',
    showToast: false,
    fallbackValue: [],
    ...options
  });
});

// Mock retry handler
export const createRetryHandler = vi.fn().mockImplementation((operation, maxRetries = 3) => {
  return vi.fn().mockImplementation(async () => {
    try {
      return await operation();
    } catch (error) {
      if (maxRetries > 0) {
        return createRetryHandler(operation, maxRetries - 1)();
      }
      throw error;
    }
  });
});

// Mock network monitor
export const NetworkMonitor = {
  isOnline: true,
  listeners: new Set(),
  init: vi.fn(),
  addListener: vi.fn().mockReturnValue(vi.fn()),
  notifyListeners: vi.fn(),
};

// Helper to reset all mocks
export const resetErrorServiceMocks = () => {
  vi.clearAllMocks();
  
  // Reset to default behaviors
  classifyError.mockReturnValue({
    type: ErrorTypes.UNKNOWN,
    severity: ErrorSeverity.MEDIUM
  });
  
  getErrorMessage.mockReturnValue({
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred.',
    action: 'Try Again'
  });
  
  ErrorLogger.getStoredErrors.mockReturnValue([]);
  NetworkMonitor.isOnline = true;
};

// Helper to simulate different error types
export const simulateError = (type, severity = ErrorSeverity.MEDIUM) => {
  classifyError.mockReturnValue({ type, severity });
  
  const errorMessages = {
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
    [ErrorTypes.VALIDATION]: {
      title: 'Invalid Input',
      message: 'Please check your input and try again.',
      action: 'Fix Input'
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
    [ErrorTypes.SERVER]: {
      title: 'Server Error',
      message: 'Something went wrong on our end. Please try again later.',
      action: 'Try Again'
    }
  };
  
  getErrorMessage.mockReturnValue(errorMessages[type] || errorMessages[ErrorTypes.UNKNOWN]);
};

// Helper to simulate network status changes
export const simulateNetworkChange = (isOnline) => {
  NetworkMonitor.isOnline = isOnline;
  NetworkMonitor.notifyListeners(isOnline);
};

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
  NetworkMonitor,
  resetErrorServiceMocks,
  simulateError,
  simulateNetworkChange
};
