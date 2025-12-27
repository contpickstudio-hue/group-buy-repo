/**
 * Push Notification Service
 * Handles push notification registration and management for Capacitor apps
 */

import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabaseClient } from './supabaseService';

/**
 * Check if push notifications are supported on the current platform
 */
export function isPushNotificationSupported() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() !== 'web';
}

/**
 * Request push notification permissions
 * @returns {Promise<{granted: boolean}>}
 */
export async function requestPushNotificationPermission() {
  if (!isPushNotificationSupported()) {
    console.log('Push notifications not supported on this platform');
    return { granted: false };
  }

  try {
    const result = await PushNotifications.requestPermissions();
    return result;
  } catch (error) {
    console.error('Error requesting push notification permissions:', error);
    return { granted: false };
  }
}

/**
 * Register device token with backend
 * @param {string} userId - User ID/email
 * @param {string} deviceToken - Device push token
 * @param {string} platform - Platform ('ios' or 'android')
 */
export async function registerDeviceToken(userId, deviceToken, platform) {
  try {
    const { data, error } = await supabaseClient
      .from('user_devices')
      .upsert({
        user_id: userId,
        device_token: deviceToken,
        platform: platform,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,device_token',
      })
      .select();

    if (error) {
      console.error('Error registering device token:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error registering device token:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Unregister device token (mark as inactive)
 * @param {string} userId - User ID/email
 * @param {string} deviceToken - Device push token
 */
export async function unregisterDeviceToken(userId, deviceToken) {
  try {
    const { error } = await supabaseClient
      .from('user_devices')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('device_token', deviceToken);

    if (error) {
      console.error('Error unregistering device token:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error unregistering device token:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Initialize push notifications
 * Call this when the app starts and user is authenticated
 * @param {string} userId - User ID/email
 */
export async function initializePushNotifications(userId) {
  if (!isPushNotificationSupported()) {
    console.log('Push notifications not supported, skipping initialization');
    return { success: false, reason: 'not_supported' };
  }

  try {
    // Request permissions
    const permissionResult = await requestPushNotificationPermission();
    if (!permissionResult.granted) {
      console.log('Push notification permissions not granted');
      return { success: false, reason: 'permission_denied' };
    }

    // Register with PushNotifications plugin
    await PushNotifications.register();

    // Set up event listeners
    setupPushNotificationListeners(userId);

    return { success: true };
  } catch (error) {
    console.error('Error initializing push notifications:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Set up push notification event listeners
 * @param {string} userId - User ID/email
 */
function setupPushNotificationListeners(userId) {
  const platform = Capacitor.getPlatform();

  // Handle registration success
  PushNotifications.addListener('registration', async (token) => {
    console.log('Push registration success, token:', token.value);
    
    // Register token with backend
    await registerDeviceToken(userId, token.value, platform);
  });

  // Handle registration errors
  PushNotifications.addListener('registrationError', (error) => {
    console.error('Push registration error:', error);
  });

  // Handle notification received while app is in foreground
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push notification received:', notification);
    
    // Show in-app notification
    // This will be handled by the notification service
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('pushNotificationReceived', {
        detail: notification
      }));
    }
  });

  // Handle notification tapped/opened
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('Push notification action performed:', action);
    
    // Navigate to relevant screen based on notification data
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('pushNotificationTapped', {
        detail: action
      }));
    }
  });
}

/**
 * Send push notification via Supabase Edge Function
 * This is typically called from backend/triggers, but can be called from frontend too
 * @param {Object} notificationData - Notification payload
 */
export async function sendPushNotification(notificationData) {
  try {
    const { data, error } = await supabaseClient.functions.invoke('send-push-notification', {
      body: notificationData,
    });

    if (error) {
      console.error('Error sending push notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Clean up push notification listeners
 */
export function removePushNotificationListeners() {
  if (!isPushNotificationSupported()) {
    return;
  }

  PushNotifications.removeAllListeners();
}

