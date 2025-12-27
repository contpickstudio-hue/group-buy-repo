/**
 * Capacitor Utilities
 * Platform detection and native feature helpers
 */

import { Capacitor } from '@capacitor/core';

/**
 * Check if running on a native platform (iOS or Android)
 */
export function isNativePlatform() {
  return Capacitor.isNativePlatform();
}

/**
 * Check if running on iOS
 */
export function isIOS() {
  return Capacitor.getPlatform() === 'ios';
}

/**
 * Check if running on Android
 */
export function isAndroid() {
  return Capacitor.getPlatform() === 'android';
}

/**
 * Check if running on web
 */
export function isWeb() {
  return Capacitor.getPlatform() === 'web';
}

/**
 * Get the current platform name
 */
export function getPlatform() {
  return Capacitor.getPlatform();
}

/**
 * Check if a Capacitor plugin is available
 * @param {string} pluginName - Name of the plugin
 */
export function isPluginAvailable(pluginName) {
  try {
    // Try to import the plugin dynamically
    // This is a simple check - actual availability depends on plugin installation
    return isNativePlatform();
  } catch (error) {
    return false;
  }
}

/**
 * Get safe area insets for iOS (notch, home indicator, etc.)
 * Returns default values for web/Android
 */
export function getSafeAreaInsets() {
  if (isIOS()) {
    // In a real implementation, you'd use @capacitor/status-bar or CSS env() variables
    return {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    };
  }
  return {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };
}

/**
 * Format platform-specific error messages
 */
export function formatPlatformError(error) {
  if (isNativePlatform()) {
    return `Native error: ${error.message}`;
  }
  return error.message;
}

