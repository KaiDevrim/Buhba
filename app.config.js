/**
 * Expo App Configuration
 *
 * This file allows dynamic configuration and supports EAS secrets.
 *
 * For local development:
 *   - Use .env.local with EXPO_PUBLIC_GOOGLE_PLACES_API_KEY
 *
 * For EAS builds:
 *   - Create secret: eas secret:create --name GOOGLE_PLACES_API_KEY --scope project
 *   - The secret will be injected at build time
 */

// Load the Google Places API key from either:
// 1. EXPO_PUBLIC_ env var - available locally (Expo auto-loads these)
// 2. EAS Secret (GOOGLE_PLACES_API_KEY) - available during EAS builds
const googlePlacesApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACES_API_KEY || '';

export default {
  expo: {
    name: 'BobaPal',
    slug: 'bobapal',
    version: '1.0.0',
    scheme: 'bobapal',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      backgroundColor: '#FFF8F0',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'tech.devrim.bobapal',
      buildNumber: '1',
      infoPlist: {
        NSCameraUsageDescription: 'BobaPal needs camera access to take photos of your boba drinks.',
        NSPhotoLibraryUsageDescription:
          'BobaPal needs photo library access to select photos of your boba drinks.',
        NSLocationWhenInUseUsageDescription:
          'BobaPal uses your location to find nearby boba shops.',
        CFBundleAllowMixedLocalizations: true,
      },
      config: {
        usesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FFF8F0',
      },
      package: 'tech.devrim.bobapal',
      versionCode: 1,
      permissions: [
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
      ],
      config: {
        googleMaps: {
          apiKey: googlePlacesApiKey,
        },
      },
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'bobapal',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    experiments: {
      tsconfigPaths: true,
    },
    plugins: [
      [
        'expo-build-properties',
        {
          ios: {
            extraPods: [
              {
                name: 'simdjson',
                configurations: ['Debug', 'Release'],
                path: '../node_modules/@nozbe/simdjson',
                modular_headers: true,
              },
            ],
          },
          android: {
            kotlinVersion: '2.0.0',
            javaVersion: '17',
          },
        },
      ],
      'expo-font',
    ],
    runtimeVersion: {
      policy: 'sdkVersion',
    },
    extra: {
      eas: {
        projectId: '7b1971c6-1d0a-41d8-8177-2a7419ad8c5a',
      },
      // Inject the API key into the app's extra config
      // This makes it available via Constants.expoConfig.extra.googlePlacesApiKey
      googlePlacesApiKey,
    },
    owner: 'kaidevrim',
  },
};
