/**
 * Geolocation Utilities
 * Provides unified geolocation access for both native and web platforms
 */

import { Geolocation } from '@capacitor/geolocation';
import { isNativePlatform } from './capacitorUtils';

/**
 * Get current position
 * @param {Object} options - Geolocation options
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number}>}
 */
export async function getCurrentPosition(options = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
  } = options;

  if (isNativePlatform()) {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy,
        timeout,
        maximumAge,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
      };
    } catch (error) {
      console.error('Error getting position with native geolocation:', error);
      throw error;
    }
  } else {
    // Fallback to web Geolocation API
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      );
    });
  }
}

/**
 * Watch position changes
 * @param {Function} callback - Callback function
 * @param {Object} options - Geolocation options
 * @returns {Promise<number>} Watch ID
 */
export async function watchPosition(callback, options = {}) {
  if (isNativePlatform()) {
    try {
      const watchId = await Geolocation.watchPosition(options, (position, err) => {
        if (err) {
          callback(null, err);
        } else {
          callback({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        }
      });
      return watchId;
    } catch (error) {
      console.error('Error watching position:', error);
      throw error;
    }
  } else {
    // Fallback to web Geolocation API
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        callback(null, error);
      },
      options
    );

    return watchId;
  }
}

/**
 * Clear position watch
 * @param {number} watchId - Watch ID from watchPosition
 */
export async function clearWatch(watchId) {
  if (isNativePlatform()) {
    await Geolocation.clearWatch({ id: watchId });
  } else {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * Check if geolocation permissions are granted
 * @returns {Promise<{granted: boolean}>}
 */
export async function checkGeolocationPermissions() {
  if (isNativePlatform()) {
    try {
      const permissions = await Geolocation.checkPermissions();
      return {
        granted: permissions.location === 'granted',
        location: permissions.location,
      };
    } catch (error) {
      return { granted: false };
    }
  } else {
    // Web permissions are handled by browser prompt
    return { granted: true };
  }
}

/**
 * Request geolocation permissions
 * @returns {Promise<{granted: boolean}>}
 */
export async function requestGeolocationPermissions() {
  if (isNativePlatform()) {
    try {
      const permissions = await Geolocation.requestPermissions();
      return {
        granted: permissions.location === 'granted',
        location: permissions.location,
      };
    } catch (error) {
      console.error('Error requesting geolocation permissions:', error);
      return { granted: false };
    }
  } else {
    // Web permissions are requested when getCurrentPosition is called
    return { granted: true };
  }
}

/**
 * Get region/city from coordinates (reverse geocoding)
 * This is a simplified version - in production, use a geocoding service
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<{region: string, city: string}>}
 */
export async function getRegionFromCoordinates(latitude, longitude) {
  // This is a placeholder - in production, use a geocoding API
  // For now, return a default region
  // You can integrate with Google Maps Geocoding API, Mapbox, or similar
  try {
    // Example using a free geocoding service (you'll need to replace with your preferred service)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
    );
    const data = await response.json();
    
    return {
      region: data.address?.state || data.address?.province || 'Unknown',
      city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
      address: data.display_name,
    };
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return {
      region: 'Unknown',
      city: 'Unknown',
      address: null,
    };
  }
}

