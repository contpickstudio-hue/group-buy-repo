import React from 'react';
import { AlertTriangle, Home, RefreshCw, Mail, Bug } from 'lucide-react';
import { useSetCurrentScreen } from '../stores';
import { ErrorLogger } from '../services/errorService';

const ErrorPage = ({ 
    type = 'generic',
    title = 'Something Went Wrong',
    message = 'An unexpected error occurred.',
    showDetails = false,
    error = null,
    canRetry = true,
    canGoHome = true
}) => {
    const setCurrentScreen = useSetCurrentScreen();
    
    const handleGoHome = () => {
        setCurrentScreen('start');
    };
    
    const handleRetry = () => {
        window.location.reload();
    };
    
    const handleReportError = () => {
        const errorReport = {
            type,
            title,
            message,
            error: error ? {
                message: error.message,
                stack: error.stack
            } : null,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            localStorage: (() => {
                try {
                    return {
                        user: localStorage.getItem('userProfile'),
                        errors: ErrorLogger.getStoredErrors().slice(0, 5) // Last 5 errors
                    };
                } catch (e) {
                    return null;
                }
            })()
        };
        
        // Copy to clipboard
        navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
            .then(() => {
                alert('Error report copied to clipboard. Please send this to support.');
            })
            .catch(() => {
                console.error('Error Report:', errorReport);
                alert('Error report logged to console. Please check browser console and send screenshot to support.');
            });
    };
    
    const handleContactSupport = () => {
        const subject = encodeURIComponent(`Error Report: ${title}`);
        const body = encodeURIComponent(`
Hi Support Team,

I encountered an error while using the Korean Community Commerce app:

Error Type: ${type}
Title: ${title}
Message: ${message}
Time: ${new Date().toISOString()}
Page: ${window.location.href}

${error ? `Technical Details:
${error.message}` : ''}

Please help me resolve this issue.

Thank you!
        `);
        
        window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
    };
    
    // Error type specific configurations
    const errorConfigs = {
        network: {
            icon: <AlertTriangle className="w-16 h-16 text-orange-600" />,
            bgColor: 'bg-orange-100',
            title: 'Connection Problem',
            message: 'Unable to connect to our servers. Please check your internet connection and try again.',
            suggestions: [
                'Check your internet connection',
                'Try refreshing the page',
                'Disable VPN if you\'re using one',
                'Try again in a few minutes'
            ]
        },
        auth: {
            icon: <AlertTriangle className="w-16 h-16 text-red-600" />,
            bgColor: 'bg-red-100',
            title: 'Authentication Error',
            message: 'There was a problem with your login session. Please sign in again.',
            suggestions: [
                'Sign out and sign back in',
                'Clear your browser cache',
                'Check if your account is still active',
                'Contact support if the problem persists'
            ]
        },
        permission: {
            icon: <AlertTriangle className="w-16 h-16 text-yellow-600" />,
            bgColor: 'bg-yellow-100',
            title: 'Access Denied',
            message: 'You don\'t have permission to access this resource.',
            suggestions: [
                'Make sure you\'re signed in to the correct account',
                'Check if your account has the required permissions',
                'Contact an administrator for access',
                'Try refreshing your session'
            ]
        },
        notFound: {
            icon: <AlertTriangle className="w-16 h-16 text-blue-600" />,
            bgColor: 'bg-blue-100',
            title: 'Page Not Found',
            message: 'The page you\'re looking for doesn\'t exist or has been moved.',
            suggestions: [
                'Check the URL for typos',
                'Use the navigation menu to find what you need',
                'Go back to the home page',
                'Search for the content you were looking for'
            ]
        },
        server: {
            icon: <AlertTriangle className="w-16 h-16 text-red-600" />,
            bgColor: 'bg-red-100',
            title: 'Server Error',
            message: 'Our servers are experiencing issues. We\'re working to fix this.',
            suggestions: [
                'Try again in a few minutes',
                'Check our status page for updates',
                'Contact support if the issue persists',
                'Save your work and try again later'
            ]
        },
        generic: {
            icon: <AlertTriangle className="w-16 h-16 text-gray-600" />,
            bgColor: 'bg-gray-100',
            title: 'Something Went Wrong',
            message: 'An unexpected error occurred. Please try again.',
            suggestions: [
                'Refresh the page',
                'Clear your browser cache',
                'Try using a different browser',
                'Contact support if the problem continues'
            ]
        }
    };
    
    const config = errorConfigs[type] || errorConfigs.generic;
    const displayTitle = title || config.title;
    const displayMessage = message || config.message;
    
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
                {/* Error Icon and Title */}
                <div className="text-center mb-8">
                    <div className={`w-20 h-20 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}>
                        {config.icon}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">
                        {displayTitle}
                    </h1>
                    <p className="text-gray-600 text-lg">
                        {displayMessage}
                    </p>
                </div>
                
                {/* Error Details (Development) */}
                {showDetails && error && import.meta.env.DEV && (
                    <div className="mb-8 p-4 bg-gray-100 rounded-lg">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">
                            Technical Details:
                        </h3>
                        <p className="text-xs text-gray-600 font-mono break-all">
                            {error.message}
                        </p>
                        {error.stack && (
                            <details className="mt-2">
                                <summary className="text-xs text-gray-500 cursor-pointer">
                                    Stack Trace
                                </summary>
                                <pre className="text-xs text-gray-500 mt-2 overflow-auto">
                                    {error.stack}
                                </pre>
                            </details>
                        )}
                    </div>
                )}
                
                {/* Suggestions */}
                {config.suggestions && (
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            What you can try:
                        </h3>
                        <ul className="space-y-2">
                            {config.suggestions.map((suggestion, index) => (
                                <li key={index} className="flex items-start">
                                    <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    <span className="text-gray-600">{suggestion}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                {/* Action Buttons */}
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        {canRetry && (
                            <button
                                onClick={handleRetry}
                                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                            >
                                <RefreshCw className="w-5 h-5 mr-2" />
                                Try Again
                            </button>
                        )}
                        
                        {canGoHome && (
                            <button
                                onClick={handleGoHome}
                                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                            >
                                <Home className="w-5 h-5 mr-2" />
                                Go Home
                            </button>
                        )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleReportError}
                            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center text-sm"
                        >
                            <Bug className="w-4 h-4 mr-2" />
                            Copy Error Report
                        </button>
                        
                        <button
                            onClick={handleContactSupport}
                            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center text-sm"
                        >
                            <Mail className="w-4 h-4 mr-2" />
                            Contact Support
                        </button>
                    </div>
                </div>
                
                {/* Error ID */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-400">
                        Error ID: {Date.now().toString(36).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Time: {new Date().toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    );
};

// Specific error page components
export const NetworkErrorPage = (props) => (
    <ErrorPage type="network" {...props} />
);

export const AuthErrorPage = (props) => (
    <ErrorPage type="auth" {...props} />
);

export const PermissionErrorPage = (props) => (
    <ErrorPage type="permission" {...props} />
);

export const NotFoundPage = (props) => (
    <ErrorPage type="notFound" {...props} />
);

export const ServerErrorPage = (props) => (
    <ErrorPage type="server" {...props} />
);

export default ErrorPage;
