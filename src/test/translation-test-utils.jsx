/**
 * Translation Test Utilities
 * Provides test helpers for components using TranslationProvider
 */

import React from 'react';
import { render } from '@testing-library/react';
import TranslationProvider from '../contexts/TranslationProvider';

/**
 * Custom render function that wraps components with TranslationProvider
 * Use this instead of the default render from @testing-library/react
 */
export const renderWithTranslations = (ui, options = {}) => {
    const Wrapper = ({ children }) => (
        <TranslationProvider>
            {children}
        </TranslationProvider>
    );

    return render(ui, { wrapper: Wrapper, ...options });
};

/**
 * Mock translation function for tests that don't need full translation context
 */
export const mockT = (key, params = {}) => {
    // Simple mock that returns the key or interpolated value
    if (params && Object.keys(params).length > 0) {
        let result = key;
        Object.entries(params).forEach(([paramKey, value]) => {
            result = result.replace(`{{${paramKey}}}`, value);
        });
        return result;
    }
    return key;
};

export default { renderWithTranslations, mockT };

