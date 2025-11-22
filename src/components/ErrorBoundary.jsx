import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { ErrorLogger, showErrorToast } from '../services/errorService';

// Error fallback component for different error types
const ErrorFallback = ({ error, resetErrorBoundary, resetKeys }) => {
    const isChunkError = error?.message?.includes('Loading chunk') || 
                        error?.message?.includes('ChunkLoadError');
    
    const isNetworkError = error?.message?.includes('NetworkError') || 
                          error?.message?.includes('fetch');
    
    const handleReload = () => {
        window.location.reload();
    };
    
    const handleGoHome = () => {
        window.location.href = '/';
    };
    
    const handleReportError = () => {
        const errorReport = {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Copy error report to clipboard
        navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
            .then(() => {
                showErrorToast(new Error('Error report copied to clipboard. Please send this to support.'));
            })
            .catch(() => {
                console.error('Error report:', errorReport);
                showErrorToast(new Error('Error report logged to console. Please check browser console.'));
            });
    };
    
    if (isChunkError) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <RefreshCw className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900 mb-2">
                        Update Available
                    </h1>
                    <p className="text-gray-600 mb-6">
                        A new version of the app is available. Please refresh to get the latest updates.
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={handleReload}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Refresh App
                        </button>
                        <button
                            onClick={resetErrorBoundary}
                            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    if (isNetworkError) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900 mb-2">
                        Connection Problem
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Unable to connect to our servers. Please check your internet connection and try again.
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={resetErrorBoundary}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={handleGoHome}
                            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
                        >
                            Go Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    // Generic error fallback
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-6">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900 mb-2">
                        Something Went Wrong
                    </h1>
                    <p className="text-gray-600">
                        An unexpected error occurred. We've been notified and are working to fix it.
                    </p>
                </div>
                
                {/* Error details (development only) */}
                {import.meta.env.DEV && (
                    <div className="mb-6 p-4 bg-gray-100 rounded-md">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Error Details:</h3>
                        <p className="text-xs text-gray-600 font-mono break-all">
                            {error.message}
                        </p>
                    </div>
                )}
                
                <div className="space-y-3">
                    <button
                        onClick={resetErrorBoundary}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                    </button>
                    
                    <div className="flex space-x-3">
                        <button
                            onClick={handleGoHome}
                            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
                        >
                            <Home className="w-4 h-4 mr-2" />
                            Go Home
                        </button>
                        
                        <button
                            onClick={handleReportError}
                            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
                        >
                            <Bug className="w-4 h-4 mr-2" />
                            Report Bug
                        </button>
                    </div>
                </div>
                
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        Error ID: {Date.now().toString(36)}
                    </p>
                </div>
            </div>
        </div>
    );
};

// Error boundary wrapper with logging
const GlobalErrorBoundary = ({ children }) => {
    const handleError = (error, errorInfo) => {
        // Log error with context
        ErrorLogger.log(error, {
            componentStack: errorInfo.componentStack,
            errorBoundary: 'GlobalErrorBoundary',
            timestamp: new Date().toISOString()
        });
    };
    
    const handleReset = (details) => {
        // Log recovery attempt
        console.log('Error boundary reset:', details);
        
        // Clear any cached data that might be causing issues
        if (details.reason === 'keys') {
            console.log('Resetting due to key change');
        }
    };
    
    return (
        <ReactErrorBoundary
            FallbackComponent={ErrorFallback}
            onError={handleError}
            onReset={handleReset}
            resetKeys={[window.location.pathname]} // Reset on route change
        >
            {children}
        </ReactErrorBoundary>
    );
};

// Component-level error boundary for specific sections
export const SectionErrorBoundary = ({ 
    children, 
    fallback = null, 
    section = 'Component' 
}) => {
    const handleError = (error, errorInfo) => {
        ErrorLogger.log(error, {
            section,
            componentStack: errorInfo.componentStack,
            errorBoundary: 'SectionErrorBoundary'
        });
    };
    
    const DefaultFallback = ({ error, resetErrorBoundary }) => (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800">
                        {section} Error
                    </h3>
                    <p className="text-sm text-red-600 mt-1">
                        This section couldn't load properly.
                    </p>
                </div>
                <button
                    onClick={resetErrorBoundary}
                    className="ml-4 text-sm text-red-600 hover:text-red-800 underline"
                >
                    Retry
                </button>
            </div>
        </div>
    );
    
    return (
        <ReactErrorBoundary
            FallbackComponent={fallback || DefaultFallback}
            onError={handleError}
        >
            {children}
        </ReactErrorBoundary>
    );
};

// Async component error boundary
export const AsyncErrorBoundary = ({ 
    children, 
    loading = false,
    error = null,
    retry = null 
}) => {
    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading...</span>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                        <div>
                            <h3 className="text-sm font-medium text-red-800">
                                Failed to Load
                            </h3>
                            <p className="text-sm text-red-600 mt-1">
                                {error}
                            </p>
                        </div>
                    </div>
                    {retry && (
                        <button
                            onClick={retry}
                            className="ml-4 bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200 transition-colors"
                        >
                            Retry
                        </button>
                    )}
                </div>
            </div>
        );
    }
    
    return (
        <SectionErrorBoundary section="Async Component">
            {children}
        </SectionErrorBoundary>
    );
};

export default GlobalErrorBoundary;
