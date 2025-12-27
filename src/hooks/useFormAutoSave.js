/**
 * useFormAutoSave Hook
 * Automatically saves form data to localStorage and restores on mount
 */

import { useEffect, useRef } from 'react';

/**
 * Hook to auto-save form data to localStorage
 * @param {Object} formData - Current form data
 * @param {string} storageKey - localStorage key to save under
 * @param {boolean} enabled - Whether auto-save is enabled (default: true)
 */
export const useFormAutoSave = (formData, storageKey, enabled = true) => {
    const isInitialMount = useRef(true);
    const lastSavedRef = useRef('');

    // Save form data to localStorage whenever it changes
    useEffect(() => {
        if (!enabled || !storageKey) return;

        // Skip save on initial mount
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        // Debounce saves - only save if data actually changed
        const currentData = JSON.stringify(formData);
        if (currentData === lastSavedRef.current) return;

        try {
            localStorage.setItem(`form_draft_${storageKey}`, currentData);
            lastSavedRef.current = currentData;
        } catch (error) {
            console.warn('Failed to save form draft:', error);
        }
    }, [formData, storageKey, enabled]);

    // Load saved draft on mount
    const loadDraft = () => {
        if (!enabled || !storageKey) return null;

        try {
            const saved = localStorage.getItem(`form_draft_${storageKey}`);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Failed to load form draft:', error);
        }
        return null;
    };

    // Clear saved draft
    const clearDraft = () => {
        if (!storageKey) return;
        try {
            localStorage.removeItem(`form_draft_${storageKey}`);
            lastSavedRef.current = '';
        } catch (error) {
            console.warn('Failed to clear form draft:', error);
        }
    };

    return { loadDraft, clearDraft };
};

export default useFormAutoSave;

