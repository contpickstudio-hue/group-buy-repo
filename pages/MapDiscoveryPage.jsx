import React, { useState, useEffect } from 'react';
import { useProducts, useUserLocation, useSetUserLocation, useSetNearbyProducts } from '../stores';
import { getCurrentLocation, getNearbyProducts, formatDistance } from '../services/geolocationService';
import GroupBuyMap from '../components/GroupBuyMap';
import { useSetCurrentScreen } from '../stores';
import toast from 'react-hot-toast';

/**
 * MapDiscoveryPage Component
 * Full-page map view for discovering nearby group buys
 */
const MapDiscoveryPage = () => {
  const products = useProducts();
  const userLocation = useUserLocation();
  const setUserLocation = useSetUserLocation();
  const setNearbyProducts = useSetNearbyProducts();
  const setCurrentScreen = useSetCurrentScreen();
  
  const [mapView, setMapView] = useState(true); // true = map, false = list
  const [radius, setRadius] = useState(5); // km
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get user location on mount
    if (!userLocation) {
      requestUserLocation();
    } else {
      loadNearbyProducts();
    }
  }, [userLocation, radius]);

  const requestUserLocation = async () => {
    setLoading(true);
    try {
      const result = await getCurrentLocation();
      if (result.success && result.location) {
        setUserLocation({
          lat: result.location.latitude,
          lng: result.location.longitude
        });
        loadNearbyProducts(result.location);
      }
    } catch (error) {
      toast.error('Could not get your location. Please enable location permissions.');
      console.error('Location error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNearbyProducts = async (location = userLocation) => {
    if (!location) return;
    
    setLoading(true);
    try {
      const result = await getNearbyProducts(
        location.lat,
        location.lng,
        radius * 1000 // Convert km to meters
      );
      if (result.success) {
        setNearbyProducts(result.products);
      }
    } catch (error) {
      console.error('Failed to load nearby products:', error);
      toast.error('Failed to load nearby products');
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product) => {
    // Navigate to product detail page
    window.location.hash = `groupbuy/${product.id}`;
    setCurrentScreen('groupbuys');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Discover Nearby</h1>
          <div className="flex items-center gap-4">
            {/* Radius selector */}
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value={1}>1 km</option>
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={25}>25 km</option>
            </select>
            
            {/* View toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setMapView(true)}
                className={`px-3 py-2 text-sm font-medium ${
                  mapView
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Map
              </button>
              <button
                onClick={() => setMapView(false)}
                className={`px-3 py-2 text-sm font-medium ${
                  !mapView
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Map or List View */}
      <div className="relative" style={{ height: 'calc(100vh - 80px)' }}>
        {mapView ? (
          <GroupBuyMap
            center={userLocation}
            zoom={12}
            radiusKm={radius}
            onProductClick={handleProductClick}
          />
        ) : (
          <div className="max-w-7xl mx-auto p-4 overflow-y-auto h-full">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Loading nearby products...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products
                  .filter(p => p.latitude && p.longitude)
                  .map((product) => {
                    let distance = null;
                    if (userLocation) {
                      const R = 6371000;
                      const dLat = toRad(product.latitude - userLocation.lat);
                      const dLon = toRad(product.longitude - userLocation.lng);
                      const a =
                        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(toRad(userLocation.lat)) *
                          Math.cos(toRad(product.latitude)) *
                          Math.sin(dLon / 2) *
                          Math.sin(dLon / 2);
                      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                      distance = R * c;
                    }
                    
                    return (
                      <div
                        key={product.id}
                        onClick={() => handleProductClick(product)}
                        className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
                      >
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {product.title}
                        </h3>
                        <p className="text-blue-600 font-bold text-lg mb-2">
                          ${product.price}
                        </p>
                        {distance !== null && (
                          <p className="text-sm text-gray-500">
                            {formatDistance(distance)} away
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

export default MapDiscoveryPage;

