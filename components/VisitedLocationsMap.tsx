import React, { useMemo, memo, useRef, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Modal,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '@/constants';
import { searchNearbyBobaShops, NearbyBobaShop } from '../services';

export interface VisitedLocation {
  id: string;
  storeName: string;
  latitude: number;
  longitude: number;
  visitCount: number;
}

interface VisitedLocationsMapProps {
  locations: VisitedLocation[];
  height?: number;
  fullScreen?: boolean;
}

const DEFAULT_REGION: Region = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const VisitedLocationsMap: React.FC<VisitedLocationsMapProps> = memo(
  ({ locations, height = 250, fullScreen = false }) => {
    const mapRef = useRef<MapView>(null);
    const fullScreenMapRef = useRef<MapView>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [nearbyShops, setNearbyShops] = useState<NearbyBobaShop[]>([]);
    const [showNearbyShops, setShowNearbyShops] = useState(false);
    const [currentMapRegion, setCurrentMapRegion] = useState<Region | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<VisitedLocation | null>(null);
    const [userRegion, setUserRegion] = useState<Region | null>(null);
    const insets = useSafeAreaInsets();

    useEffect(() => {
      if (locations.length === 0) {
        setSelectedLocation(null);
        return;
      }

      setSelectedLocation((current) => {
        if (current) {
          const stillExists = locations.find((location) => location.id === current.id);
          if (stillExists) {
            return stillExists;
          }
        }

        return locations[0];
      });
    }, [locations]);

    const getCurrentLocationRegion = useCallback(async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return null;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        return {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        } satisfies Region;
      } catch (error) {
        if (__DEV__) {
          console.error('Failed to get current location:', error);
        }
        return null;
      }
    }, []);

    useEffect(() => {
      if (!fullScreen) {
        return;
      }

      let isMounted = true;

      getCurrentLocationRegion().then((region) => {
        if (isMounted && region) {
          setUserRegion(region);
          fullScreenMapRef.current?.animateToRegion(region, 500);
        }
      });

      return () => {
        isMounted = false;
      };
    }, [fullScreen, getCurrentLocationRegion]);

    // Calculate the region to fit all markers
    const mapRegion = useMemo(() => {
      if (locations.length === 0) {
        return DEFAULT_REGION;
      }

      const lats = locations.map((l) => l.latitude);
      const lngs = locations.map((l) => l.longitude);

      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;

      // Add padding to the delta
      const latDelta = Math.max((maxLat - minLat) * 1.5, 0.02);
      const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.02);

      return {
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      };
    }, [locations]);

    // Get marker color based on visit count
    const getMarkerColor = (visitCount: number): string => {
      if (visitCount >= 10) return '#FF5722'; // Hot - Orange Red
      if (visitCount >= 5) return '#FF9800'; // Warm - Orange
      if (visitCount >= 3) return '#FFC107'; // Medium - Yellow
      return COLORS.primary; // Default
    };

    const handleOpenFullScreen = useCallback(() => {
      setIsFullScreen(true);
    }, []);

    const handleCloseFullScreen = useCallback(() => {
      setIsFullScreen(false);
      setShowNearbyShops(false);
      setNearbyShops([]);
    }, []);

    const handleGoToCurrentLocation = useCallback(async () => {
      setIsLocating(true);
      try {
        const currentRegion = await getCurrentLocationRegion();

        if (!currentRegion) {
          Alert.alert(
            'Permission Denied',
            'Please enable location permissions to use this feature.'
          );
          return;
        }

        setUserRegion(currentRegion);

        fullScreenMapRef.current?.animateToRegion(currentRegion, 500);
      } catch (error) {
        if (__DEV__) {
          console.error('Failed to get current location:', error);
        }
        Alert.alert('Error', 'Failed to get your current location.');
      } finally {
        setIsLocating(false);
      }
    }, [getCurrentLocationRegion]);

    const handleFitAllMarkers = useCallback(() => {
      fullScreenMapRef.current?.animateToRegion(mapRegion, 500);
    }, [mapRegion]);

    const handleZoomIn = useCallback(() => {
      const region = currentMapRegion || mapRegion;
      const newRegion: Region = {
        ...region,
        latitudeDelta: region.latitudeDelta / 2,
        longitudeDelta: region.longitudeDelta / 2,
      };
      fullScreenMapRef.current?.animateToRegion(newRegion, 300);
    }, [currentMapRegion, mapRegion]);

    const handleZoomOut = useCallback(() => {
      const region = currentMapRegion || mapRegion;
      const newRegion: Region = {
        ...region,
        latitudeDelta: Math.min(region.latitudeDelta * 2, 180),
        longitudeDelta: Math.min(region.longitudeDelta * 2, 180),
      };
      fullScreenMapRef.current?.animateToRegion(newRegion, 300);
    }, [currentMapRegion, mapRegion]);

    const handleSearchNearby = useCallback(async () => {
      setIsSearching(true);
      try {
        // Get current location for search
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Denied',
            'Please enable location permissions to search for nearby shops.'
          );
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const shops = await searchNearbyBobaShops({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (shops.length === 0) {
          Alert.alert('No Results', 'No boba shops found nearby. Try a different area.');
          return;
        }

        setNearbyShops(shops);
        setShowNearbyShops(true);

        // Fit map to show all nearby shops
        if (shops.length > 0 && fullScreenMapRef.current) {
          const lats = shops.map((s) => s.latitude);
          const lngs = shops.map((s) => s.longitude);

          const minLat = Math.min(...lats, location.coords.latitude);
          const maxLat = Math.max(...lats, location.coords.latitude);
          const minLng = Math.min(...lngs, location.coords.longitude);
          const maxLng = Math.max(...lngs, location.coords.longitude);

          const centerLat = (minLat + maxLat) / 2;
          const centerLng = (minLng + maxLng) / 2;

          const latDelta = Math.max((maxLat - minLat) * 1.5, 0.02);
          const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.02);

          fullScreenMapRef.current.animateToRegion(
            {
              latitude: centerLat,
              longitude: centerLng,
              latitudeDelta: latDelta,
              longitudeDelta: lngDelta,
            },
            500
          );
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Failed to search nearby:', error);
        }
        Alert.alert('Error', 'Failed to search for nearby boba shops.');
      } finally {
        setIsSearching(false);
      }
    }, []);

    const handleHideNearbyShops = useCallback(() => {
      setShowNearbyShops(false);
      setNearbyShops([]);
    }, []);

    const handleRegionChange = useCallback((region: Region) => {
      setCurrentMapRegion(region);
    }, []);

    const initialMapRegion = userRegion || mapRegion;

    const renderMap = (isFullScreenMap: boolean) => (
      <MapView
        ref={isFullScreenMap ? fullScreenMapRef : mapRef}
        style={isFullScreenMap ? styles.fullScreenMap : styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialMapRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={isFullScreenMap}
        pitchEnabled={isFullScreenMap}
        rotateEnabled={isFullScreenMap}
        zoomEnabled
        scrollEnabled={isFullScreenMap || fullScreen}
        onRegionChangeComplete={isFullScreenMap ? handleRegionChange : undefined}>
        {/* Visited locations markers */}
        {locations.map((location) => (
          <Marker
            key={location.id}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={location.storeName}
            description={`${location.visitCount} visit${location.visitCount > 1 ? 's' : ''}`}
            pinColor={getMarkerColor(location.visitCount)}
            onPress={() => setSelectedLocation(location)}
          />
        ))}
        {/* Nearby boba shops markers */}
        {showNearbyShops &&
          nearbyShops.map((shop) => (
            <Marker
              key={shop.placeId}
              coordinate={{
                latitude: shop.latitude,
                longitude: shop.longitude,
              }}
              title={shop.name}
              description={shop.address}
              pinColor="#4A90E2" // Blue for nearby shops
            />
          ))}
      </MapView>
    );

    const renderLegend = () => (
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.legendText}>1-2</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FFC107' }]} />
          <Text style={styles.legendText}>3-4</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
          <Text style={styles.legendText}>5-9</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF5722' }]} />
          <Text style={styles.legendText}>10+</Text>
        </View>
        {showNearbyShops && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4A90E2' }]} />
            <Text style={styles.legendText}>Nearby</Text>
          </View>
        )}
      </View>
    );

    if (fullScreen) {
      return (
        <View style={styles.fullPageContainer}>
          {renderMap(true)}

          <View style={[styles.searchBarWrapper, { top: insets.top + SPACING.sm }]}>
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>⌕</Text>
              <Text style={styles.searchPlaceholder}>Search for stores</Text>
            </View>
          </View>

          <View style={[styles.fullScreenQuickControls, { right: SPACING.md }]}>
            <TouchableOpacity
              style={[styles.quickControlButton, isLocating && styles.controlButtonDisabled]}
              onPress={handleGoToCurrentLocation}
              disabled={isLocating}>
              {isLocating ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={styles.quickControlText}>◎</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickControlButton} onPress={handleZoomIn}>
              <Text style={styles.quickControlText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickControlButton} onPress={handleZoomOut}>
              <Text style={styles.quickControlText}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickControlButton, styles.findNearbyQuickButton]}
              onPress={showNearbyShops ? handleHideNearbyShops : handleSearchNearby}
              disabled={isSearching}>
              {isSearching ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <Text style={styles.findNearbyQuickText}>{showNearbyShops ? '✕' : '🧋'}</Text>
              )}
            </TouchableOpacity>
          </View>

          {(selectedLocation || userRegion) && (
            <View style={[styles.selectedLocationCard, { bottom: insets.bottom + 88 }]}>
              <Text style={styles.selectedStoreName}>
                {selectedLocation ? selectedLocation.storeName : 'Your Location'}
              </Text>
              <Text style={styles.selectedStoreMeta}>
                {selectedLocation
                  ? `${selectedLocation.visitCount} visit${selectedLocation.visitCount > 1 ? 's' : ''}`
                  : showNearbyShops
                    ? `${nearbyShops.length} nearby boba shop${nearbyShops.length > 1 ? 's' : ''}`
                    : 'Tap the boba button to find nearby shops'}
              </Text>
            </View>
          )}
        </View>
      );
    }

    return (
      <>
        <TouchableOpacity
          style={[styles.container, { height }]}
          onPress={handleOpenFullScreen}
          activeOpacity={0.9}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>📍 Your Boba Map</Text>
            <Text style={styles.expandHint}>Tap to expand</Text>
          </View>
          <View style={styles.mapContainer}>{renderMap(false)}</View>
          {renderLegend()}
        </TouchableOpacity>

        <Modal
          visible={isFullScreen}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={handleCloseFullScreen}>
          <View
            style={[
              styles.fullScreenContainer,
              { paddingTop: insets.top, paddingBottom: insets.bottom },
            ]}>
            <StatusBar barStyle="dark-content" />

            {/* Full Screen Map */}
            <View style={styles.fullScreenMapContainer}>{renderMap(true)}</View>

            {/* Header */}
            <View style={styles.fullScreenHeader}>
              <TouchableOpacity style={styles.closeButton} onPress={handleCloseFullScreen}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.fullScreenTitle}>Your Boba Map</Text>
              <View style={styles.headerPlaceholder} />
            </View>

            {/* Zoom Controls */}
            <View style={styles.zoomControls}>
              <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
                <Text style={styles.zoomButtonText}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
                <Text style={styles.zoomButtonText}>−</Text>
              </TouchableOpacity>
            </View>

            {/* Map Controls */}
            <View style={styles.mapControls}>
              <TouchableOpacity
                style={[styles.controlButton, isLocating && styles.controlButtonDisabled]}
                onPress={handleGoToCurrentLocation}
                disabled={isLocating}>
                {isLocating ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Text style={styles.controlButtonText}>📍</Text>
                )}
                <Text style={styles.controlButtonLabel}>My Location</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.controlButton} onPress={handleFitAllMarkers}>
                <Text style={styles.controlButtonText}>🗺️</Text>
                <Text style={styles.controlButtonLabel}>Fit All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.controlButton,
                  styles.searchButton,
                  isSearching && styles.controlButtonDisabled,
                ]}
                onPress={showNearbyShops ? handleHideNearbyShops : handleSearchNearby}
                disabled={isSearching}>
                {isSearching ? (
                  <ActivityIndicator size="small" color={COLORS.background} />
                ) : (
                  <Text style={styles.controlButtonText}>{showNearbyShops ? '✕' : '🔍'}</Text>
                )}
                <Text style={[styles.controlButtonLabel, styles.searchButtonLabel]}>
                  {showNearbyShops ? 'Hide' : 'Find Boba'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Nearby Shops Count Badge */}
            {showNearbyShops && nearbyShops.length > 0 && (
              <View style={styles.nearbyBadge}>
                <Text style={styles.nearbyBadgeText}>
                  🧋 {nearbyShops.length} boba shop{nearbyShops.length > 1 ? 's' : ''} nearby
                </Text>
              </View>
            )}

            {/* Legend */}
            <View style={styles.fullScreenLegend}>
              <Text style={styles.legendTitle}>Visit frequency:</Text>
              {renderLegend()}
            </View>
          </View>
        </Modal>
      </>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text.accent,
  },
  expandHint: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.light,
  },
  mapContainer: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    height: 180,
  },
  map: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.sm,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.xs,
  },
  legendText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
  },
  // Full Screen Styles
  fullScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  fullPageContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  fullScreenHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  closeButtonText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.primary,
    fontWeight: 'bold',
  },
  fullScreenTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text.accent,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  headerPlaceholder: {
    width: 40,
  },
  fullScreenMapContainer: {
    flex: 1,
  },
  fullScreenMap: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  searchBarWrapper: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
  },
  searchBar: {
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    ...SHADOWS.md,
  },
  searchIcon: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.secondary,
    marginRight: SPACING.sm,
  },
  searchPlaceholder: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
  },
  fullScreenQuickControls: {
    position: 'absolute',
    top: 130,
    gap: SPACING.xs,
  },
  quickControlButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  quickControlText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  findNearbyQuickButton: {
    backgroundColor: COLORS.primary,
  },
  findNearbyQuickText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.background,
  },
  selectedLocationCard: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.md,
  },
  selectedStoreName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  selectedStoreMeta: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  mapControls: {
    position: 'absolute',
    bottom: 120,
    right: SPACING.lg,
  },
  controlButton: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    minWidth: 80,
    marginBottom: SPACING.sm,
    ...SHADOWS.md,
  },
  controlButtonDisabled: {
    opacity: 0.6,
  },
  controlButtonText: {
    fontSize: FONT_SIZES.xxl,
  },
  controlButtonLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
  },
  searchButtonLabel: {
    color: COLORS.background,
  },
  zoomControls: {
    position: 'absolute',
    top: 120,
    right: SPACING.lg,
  },
  zoomButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    ...SHADOWS.md,
  },
  zoomButtonText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  nearbyBadge: {
    position: 'absolute',
    top: 120,
    left: SPACING.lg,
    backgroundColor: '#4A90E2',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    ...SHADOWS.sm,
  },
  nearbyBadgeText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  fullScreenLegend: {
    position: 'absolute',
    bottom: 40,
    left: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  legendTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
});

export default VisitedLocationsMap;
