import React, { useState } from 'react';
import { useSetCurrentScreen, useSignUp, useSignIn, useSignInWithGoogle } from '../stores';
import { useFormHandler } from '../hooks/useErrorHandler';
import { AsyncErrorBoundary } from '../components/ErrorBoundary';

const AuthPage = () => {
    const setCurrentScreen = useSetCurrentScreen();
    const signUp = useSignUp();
    const signIn = useSignIn();
    const signInWithGoogle = useSignInWithGoogle();
    const [isSignUp, setIsSignUp] = useState(true);
    
    // Use form handler with validation
    const {
        values: formData,
        validationErrors,
        touched,
        isLoading,
        error,
        handleChange,
        handleBlur,
        handleSubmit,
        clearError
    } = useFormHandler({
        name: '',
        email: '',
        password: '',
        roles: new Set(['customer'])
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        handleChange(name, value);
    };

    const handleInputBlur = (e) => {
        const { name } = e.target;
        handleBlur(name);
    };

    const handleRoleToggle = (role) => {
        const newRoles = new Set(formData.roles);
        if (newRoles.has(role)) {
            newRoles.delete(role);
        } else {
            newRoles.add(role);
        }
        handleChange('roles', newRoles);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        
        // Define validation rules
        const validationRules = {
            email: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
            },
            password: {
                required: true,
                minLength: 6,
                message: 'Password must be at least 6 characters'
            },
            ...(isSignUp && {
                name: {
                    required: true,
                    minLength: 2,
                    message: 'Name must be at least 2 characters'
                }
            })
        };
        
        const result = await handleSubmit(
            async (formValues) => {
                let authResult;
                if (isSignUp) {
                    authResult = await signUp(formValues.email, formValues.password, {
                        name: formValues.name,
                        roles: Array.from(formValues.roles)
                    });
                } else {
                    authResult = await signIn(formValues.email, formValues.password);
                }
                
                if (!authResult.success) {
                    throw new Error(authResult.error);
                }
                
                return authResult;
            },
            validationRules,
            {
                successMessage: isSignUp ? 'Account created successfully!' : 'Welcome back!',
                errorContext: isSignUp ? 'Account Registration' : 'Sign In'
            }
        );
        
        if (result.success) {
            setCurrentScreen('browse');
        }
    };

    const handleGoogleSignIn = async () => {
        const result = await handleSubmit(
            async () => {
                const authResult = await signInWithGoogle();
                if (!authResult.success) {
                    throw new Error(authResult.error);
                }
                return authResult;
            },
            {}, // No validation needed for Google sign-in
            {
                successMessage: 'Redirecting to Google...',
                errorContext: 'Google Sign In'
            }
        );
        
        // Google sign-in will redirect, so we don't need to handle success here
    };

    return (
        <AsyncErrorBoundary loading={isLoading} error={error} retry={clearError}>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {isSignUp ? 'Join Korean Community Commerce' : 'Welcome Back'}
                    </h2>
                    <p className="text-gray-600 mt-2">
                        {isSignUp 
                            ? 'Connect with your community through group buys and local errands'
                            : 'Sign in to your account'
                        }
                    </p>
                </div>

                {/* Error display is now handled by AsyncErrorBoundary */}

                <form onSubmit={handleFormSubmit} className="space-y-4">
                    {isSignUp && (
                        <div>
                            <label htmlFor="name-input" className="block text-sm font-medium text-gray-700 mb-1">
                                Name
                            </label>
                            <input
                                id="name-input"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                onBlur={handleInputBlur}
                                required
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base ${
                                    touched.name && validationErrors.name 
                                        ? 'border-red-300 focus:ring-red-500' 
                                        : 'border-gray-300'
                                }`}
                                placeholder="Your full name"
                            />
                            {touched.name && validationErrors.name && (
                                <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                            )}
                        </div>
                    )}

                    <div>
                        <label htmlFor="email-input" className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            id="email-input"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            required
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base ${
                                touched.email && validationErrors.email 
                                    ? 'border-red-300 focus:ring-red-500' 
                                    : 'border-gray-300'
                            }`}
                            placeholder="your@email.com"
                        />
                        {touched.email && validationErrors.email && (
                            <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="password-input" className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            id="password-input"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            required
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base ${
                                touched.password && validationErrors.password 
                                    ? 'border-red-300 focus:ring-red-500' 
                                    : 'border-gray-300'
                            }`}
                            placeholder="••••••••"
                        />
                        {touched.password && validationErrors.password && (
                            <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
                        )}
                    </div>

                    {isSignUp && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                I want to... (select all that apply)
                            </label>
                            <div className="space-y-2">
                                {[
                                    { key: 'customer', label: 'Join group buys & post errands', icon: '🛒' },
                                    { key: 'vendor', label: 'Sell products through group buys', icon: '🏪' },
                                    { key: 'helper', label: 'Help with community errands', icon: '🤝' }
                                ].map(role => (
                                    <label key={role.key} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.roles.has(role.key)}
                                            onChange={() => handleRoleToggle(role.key)}
                                            className="mr-3"
                                        />
                                        <span className="mr-2">{role.icon}</span>
                                        <span className="text-sm">{role.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                {isSignUp ? 'Creating Account...' : 'Signing In...'}
                            </div>
                        ) : (
                            isSignUp ? 'Get Started' : 'Sign In'
                        )}
                    </button>
                </form>

                <div className="mt-4">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">or continue with</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className="mt-3 w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Processing...' : 'Continue with Google'}
                    </button>
                </div>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                        {isSignUp 
                            ? 'Already have an account? Sign in' 
                            : "Don't have an account? Sign up"
                        }
                    </button>
                </div>
            </div>
        </div>
        </AsyncErrorBoundary>
    );
};

export default AuthPage;
