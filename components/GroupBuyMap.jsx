import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { useProducts, useUserLocation } from '../stores';
import { formatDistance } from '../services/geolocationService';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 43.6532, // Toronto default
  lng: -79.3832
};

/**
 * GroupBuyMap Component
 * Google Maps component showing nearby group buys
 */
const GroupBuyMap = ({ 
  onProductClick,
  center = null,
  zoom = 12,
  radiusKm = 5
}) => {
  const products = useProducts();
  const userLocation = useUserLocation();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mapCenter, setMapCenter] = useState(center || userLocation || defaultCenter);
  const mapRef = useRef(null);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  useEffect(() => {
    if (userLocation && !center) {
      setMapCenter(userLocation);
    }
  }, [userLocation, center]);

  // Filter products that have location data
  const productsWithLocation = products.filter(p => 
    p.latitude != null && p.longitude != null
  );

  const handleMarkerClick = (product) => {
    setSelectedProduct(product);
  };

  const handleInfoWindowClose = () => {
    setSelectedProduct(null);
  };

  const handleProductCardClick = (product) => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  // Calculate distance for products if user location is available
  const productsWithDistance = productsWithLocation.map(product => {
    let distance = null;
    if (userLocation) {
      const R = 6371000; // Earth radius in meters
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
    return { ...product, distance };
  });

  const toRad = (degrees) => (degrees * Math.PI) / 180;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center p-8">
          <p className="text-gray-600 mb-2">Google Maps API key not configured</p>
          <p className="text-sm text-gray-500">
            Please add VITE_GOOGLE_MAPS_API_KEY to your .env file
          </p>
        </div>
      </div>
    );
  }

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={zoom}
        onLoad={onMapLoad}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true
        }}
      >
        {/* User location marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              path: window.google?.maps?.SymbolPath?.CIRCLE,
              scale: 8,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2
            }}
            title="Your location"
          />
        )}

        {/* Product markers */}
        {productsWithDistance.map((product) => (
          <Marker
            key={product.id}
            position={{
              lat: product.latitude,
              lng: product.longitude
            }}
            onClick={() => handleMarkerClick(product)}
            title={product.title}
          />
        ))}

        {/* Info window for selected product */}
        {selectedProduct && (
          <InfoWindow
            position={{
              lat: selectedProduct.latitude,
              lng: selectedProduct.longitude
            }}
            onCloseClick={handleInfoWindowClose}
          >
            <div className="p-2 max-w-xs">
              <h3 className="font-semibold text-gray-900 mb-1">
                {selectedProduct.title}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                ${selectedProduct.price} per unit
              </p>
              {selectedProduct.distance && (
                <p className="text-xs text-gray-500 mb-2">
                  {formatDistance(selectedProduct.distance)} away
                </p>
              )}
              <button
                onClick={() => handleProductCardClick(selectedProduct)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                View Details →
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default GroupBuyMap;

