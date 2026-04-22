import { VisitedLocation, VisitedLocationsMap } from '../components';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusedDrinks } from '../hooks';

const Explore: React.FC = () => {
  const { drinks } = useFocusedDrinks();

  // Calculate visited locations for the map
  const visitedLocations: VisitedLocation[] = useMemo(() => {
    const locationMap = new Map<
      string,
      { storeName: string; latitude: number; longitude: number; visitCount: number }
    >();

    drinks.forEach((drink) => {
      if (drink.latitude != null && drink.longitude != null) {
        const key = drink.placeId || `${drink.latitude},${drink.longitude}`;
        const existing = locationMap.get(key);

        if (existing) {
          existing.visitCount += 1;
        } else {
          locationMap.set(key, {
            storeName: drink.store,
            latitude: drink.latitude,
            longitude: drink.longitude,
            visitCount: 1,
          });
        }
      }
    });

    return Array.from(locationMap.entries()).map(([id, data]) => ({
      id,
      ...data,
    }));
  }, [drinks]);

  return (
    <View style={styles.mapContainer}>
      <VisitedLocationsMap locations={visitedLocations} fullScreen />
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
  },
});

export default Explore;
