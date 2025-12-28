/**
 * Camera Utilities
 * Provides unified camera/photo access for both native and web platforms
 */

import { Camera, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { isNativePlatform } from './capacitorUtils';

/**
 * Take a photo using native camera or web file input
 * @param {Object} options - Camera options
 * @returns {Promise<{dataUrl: string, format: string}>}
 */
export async function takePhoto(options = {}) {
  const {
    quality = 90,
    allowEditing = false,
    resultType = 'DataUrl', // 'Uri' or 'DataUrl' or 'Base64'
    source = 'CAMERA', // 'CAMERA' or 'PHOTOS'
  } = options;

  if (isNativePlatform()) {
    try {
      // Use Capacitor Camera plugin
      const image = await Camera.getPhoto({
        quality,
        allowEditing,
        resultType,
        source: source === 'CAMERA' ? CameraSource.Camera : CameraSource.Photos,
      });

      return {
        dataUrl: image.dataUrl,
        format: image.format,
        webPath: image.webPath,
        path: image.path,
      };
    } catch (error) {
      console.error('Error taking photo with native camera:', error);
      throw error;
    }
  } else {
    // Fallback to web file input
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = source === 'CAMERA' ? 'environment' : undefined;

      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({
            dataUrl: event.target.result,
            format: file.type,
            webPath: URL.createObjectURL(file),
          });
        };
        reader.onerror = (error) => {
          reject(error);
        };
        reader.readAsDataURL(file);
      };

      input.oncancel = () => {
        reject(new Error('Photo capture cancelled'));
      };

      input.click();
    });
  }
}

/**
 * Pick an image from photo library/gallery
 * @param {Object} options - Options
 * @returns {Promise<{dataUrl: string, format: string}>}
 */
export async function pickImage(options = {}) {
  return takePhoto({ ...options, source: 'PHOTOS' });
}

/**
 * Check if camera is available
 * @returns {Promise<boolean>}
 */
export async function isCameraAvailable() {
  if (isNativePlatform()) {
    try {
      const { Camera } = await import('@capacitor/camera');
      const permissions = await Camera.checkPermissions();
      return permissions.camera === 'granted' || permissions.photos === 'granted';
    } catch (error) {
      return false;
    }
  } else {
    // Check if getUserMedia is available
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
}

/**
 * Request camera permissions
 * @returns {Promise<{granted: boolean}>}
 */
export async function requestCameraPermissions() {
  if (isNativePlatform()) {
    try {
      const { Camera } = await import('@capacitor/camera');
      const permissions = await Camera.requestPermissions({
        permissions: ['camera', 'photos'],
      });
      return {
        granted: permissions.camera === 'granted' || permissions.photos === 'granted',
        camera: permissions.camera === 'granted',
        photos: permissions.photos === 'granted',
      };
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return { granted: false };
    }
  } else {
    // Web permissions are handled by browser
    return { granted: true };
  }
}


