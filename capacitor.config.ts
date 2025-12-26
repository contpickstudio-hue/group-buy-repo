import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.koreancommerce.app',
  appName: 'Korean Commerce',
  webDir: 'dist',
  server: {
    // For development: uncomment to use live reload with Vercel URL
    // url: 'https://your-app.vercel.app',
    // cleartext: true
    androidScheme: 'https'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    Camera: {
      permissions: {
        camera: 'This app needs access to your camera to take photos for ID verification and product images.',
        photos: 'This app needs access to your photos to select images.'
      }
    },
    Geolocation: {
      permissions: {
        location: 'This app needs access to your location to show nearby group buys and errands.'
      }
    }
  },
  ios: {
    contentInset: 'automatic'
  },
  android: {
    allowMixedContent: true,
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined
    }
  }
};

export default config;

