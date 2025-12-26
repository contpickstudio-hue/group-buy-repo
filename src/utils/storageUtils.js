/**
 * Storage Utilities
 * Unified storage interface that uses Capacitor Preferences on native and localStorage on web
 */

import { Preferences } from '@capacitor/preferences';
import { isNativePlatform } from './capacitorUtils';

/**
 * Set a value in storage
 * @param {string} key - Storage key
 * @param {any} value - Value to store (will be JSON stringified)
 * @returns {Promise<void>}
 */
export async function setStorageItem(key, value) {
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  
  if (isNativePlatform()) {
    await Preferences.set({
      key,
      value: stringValue,
    });
  } else {
    localStorage.setItem(key, stringValue);
  }
}

/**
 * Get a value from storage
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {Promise<any>}
 */
export async function getStorageItem(key, defaultValue = null) {
  try {
    let value;
    
    if (isNativePlatform()) {
      const result = await Preferences.get({ key });
      value = result.value;
    } else {
      value = localStorage.getItem(key);
    }
    
    if (value === null || value === undefined) {
      return defaultValue;
    }
    
    // Try to parse as JSON, fallback to string
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    console.error(`Error getting storage item ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Remove an item from storage
 * @param {string} key - Storage key
 * @returns {Promise<void>}
 */
export async function removeStorageItem(key) {
  if (isNativePlatform()) {
    await Preferences.remove({ key });
  } else {
    localStorage.removeItem(key);
  }
}

/**
 * Clear all storage
 * @returns {Promise<void>}
 */
export async function clearStorage() {
  if (isNativePlatform()) {
    await Preferences.clear();
  } else {
    localStorage.clear();
  }
}

/**
 * Get all keys from storage
 * @returns {Promise<string[]>}
 */
export async function getStorageKeys() {
  if (isNativePlatform()) {
    const result = await Preferences.keys();
    return result.keys;
  } else {
    return Object.keys(localStorage);
  }
}

/**
 * Check if a key exists in storage
 * @param {string} key - Storage key
 * @returns {Promise<boolean>}
 */
export async function hasStorageItem(key) {
  if (isNativePlatform()) {
    const result = await Preferences.get({ key });
    return result.value !== null;
  } else {
    return localStorage.getItem(key) !== null;
  }
}

