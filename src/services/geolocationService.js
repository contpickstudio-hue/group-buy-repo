import { Geolocation } from '@capacitor/geolocation';
import { supabaseClient } from './supabaseService';
import { apiCall } from './errorService';

/**
 * Geolocation Service
 * Handles location retrieval and proximity-based product searches
 */

/**
 * Get user's current location using Capacitor Geolocation
 */
export async function getCurrentLocation() {
  return await apiCall(async () => {
    // Check permissions
    const permissionStatus = await Geolocation.checkPermissions();
    
    if (permissionStatus.location !== 'granted') {
      // Request permission
      const requestResult = await Geolocation.requestPermissions();
      if (requestResult.location !== 'granted') {
        throw new Error('Location permission denied');
      }
    }

    // Get current position
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000
    });

    return {
      success: true,
      location: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      }
    };
  }, {
    context: 'Getting current location',
    showToast: false
  });
}

/**
 * Get nearby products using the nearby_products function
 */
export async function getNearbyProducts(lat, lng, radiusMeters = 5000) {
  return await apiCall(async () => {
    // Call the Postgres function via Supabase RPC
    const { data, error } = await supabaseClient.rpc('nearby_products', {
      user_lat: lat,
      user_lng: lng,
      radius_meters: radiusMeters
    });

    if (error) throw error;

    // Transform database format to app format
    const products = (data || []).map(p => ({
      id: p.id,
      title: p.title,
      region: p.region,
      price: parseFloat(p.price),
      description: p.description,
      deadline: p.deadline,
      deliveryDate: p.delivery_date,
      vendor: p.vendor,
      targetQuantity: p.target_quantity,
      currentQuantity: p.current_quantity,
      imageColor: p.image_color,
      imageDataUrl: p.image_data_url,
      ownerEmail: p.owner_email,
      createdAt: p.created_at,
      latitude: p.latitude,
      longitude: p.longitude,
      locationRadius: p.location_radius,
      distanceMeters: parseFloat(p.distance_meters || 0)
    }));

    return { success: true, products };
  }, {
    context: 'Getting nearby products',
    showToast: false
  });
}

/**
 * Geocode an address to lat/lng using Google Geocoding API
 * Note: Requires Google Maps API key
 */
export async function geocodeAddress(address) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Google Maps API key not configured');
  }

  return await apiCall(async () => {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );

    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error('Address not found');
    }

    const location = data.results[0].geometry.location;
    return {
      success: true,
      location: {
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: data.results[0].formatted_address
      }
    };
  }, {
    context: 'Geocoding address',
    showToast: false
  });
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(lat, lng) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Google Maps API key not configured');
  }

  return await apiCall(async () => {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );

    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error('Location not found');
    }

    return {
      success: true,
      address: data.results[0].formatted_address
    };
  }, {
    context: 'Reverse geocoding location',
    showToast: false
  });
}

/**
 * Calculate distance between two points in meters
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Format distance for display
 */
export function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

