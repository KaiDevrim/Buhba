import React, { useCallback, useState, useMemo } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import database from '../database/index.native';
import Drink from '../database/model/Drink';
import { MyDrinkCard, GradientBackground } from '../components';
import { RootStackParamList } from '@/types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '@/constants';
import { prefetchImages } from '../services';

interface MonthlyStats {
  drinkCount: number;
  storeCount: number;
  totalSpent: number;
}

const Gallery: React.FC = () => {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const fetchDrinks = useCallback(async () => {
    try {
      const allDrinks = await database.collections.get<Drink>('drinks').query().fetch();
      setDrinks(allDrinks);

      // Prefetch first 10 images for faster initial load
      const s3Keys = allDrinks.slice(0, 10).map((d) => d.s3Key);
      prefetchImages(s3Keys).catch(() => {});
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to fetch drinks:', error);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDrinks();
    }, [fetchDrinks])
  );

  // Calculate monthly stats
  const monthlyStats: MonthlyStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthDrinks = drinks.filter((drink) => {
      const drinkDate = new Date(drink.date);
      return drinkDate.getMonth() === currentMonth && drinkDate.getFullYear() === currentYear;
    });

    const stores = new Set(thisMonthDrinks.map((d) => d.store));
    const totalSpent = thisMonthDrinks.reduce((sum, d) => sum + d.price, 0);

    return {
      drinkCount: thisMonthDrinks.length,
      storeCount: stores.size,
      totalSpent,
    };
  }, [drinks]);

  const handleDrinkPress = useCallback(
    (drinkId: string) => {
      navigation.navigate('DrinkDetail', { drinkId });
    },
    [navigation]
  );

  const handleProfilePress = useCallback(() => {
    navigation.navigate('Profile');
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: Drink }) => (
      <TouchableOpacity onPress={() => handleDrinkPress(item.id)} activeOpacity={0.8}>
        <MyDrinkCard
          title={item.flavor}
          date={item.date}
          s3Key={item.s3Key}
          photoUrl={item.photoUrl}
        />
      </TouchableOpacity>
    ),
    [handleDrinkPress]
  );

  const keyExtractor = useCallback((item: Drink) => item.id, []);

  const renderHeader = useCallback(
    () => (
      <View style={styles.headerContainer}>
        {/* Top row with title and profile button */}
        <View style={styles.topRow}>
          <Text style={styles.pageTitle}>🧋 BobaPal</Text>
          <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
            <Text style={styles.profileButtonText}>👤</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.headerTitle}>This Month</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{monthlyStats.drinkCount}</Text>
            <Text style={styles.statLabel}>DRINKS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{monthlyStats.storeCount}</Text>
            <Text style={styles.statLabel}>STORES</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>${monthlyStats.totalSpent.toFixed(2)}</Text>
            <Text style={styles.statLabel}>SPENT</Text>
          </View>
        </View>
        <Text style={styles.sectionTitle}>Your Recent Drinks</Text>
      </View>
    ),
    [monthlyStats, handleProfilePress]
  );

  if (drinks.length === 0) {
    return (
      <GradientBackground>
        <View style={styles.container}>
          <View style={styles.topRow}>
            <Text style={styles.pageTitle}>🧋 BobaPal</Text>
            <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
              <Text style={styles.profileButtonText}>👤</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Your Boba Gallery</Text>
            <Text style={styles.emptyMessage}>Add some boba to see your collection!</Text>
          </View>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View style={styles.container}>
        <FlatList
          data={drinks}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={6}
          ListHeaderComponent={renderHeader}
        />
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: 50,
  },
  headerContainer: {
    marginBottom: SPACING.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  pageTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text.accent,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  profileButtonText: {
    fontSize: FONT_SIZES.lg,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: SPACING.xs,
  },
  statNumber: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text.accent,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  list: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text.accent,
    marginBottom: SPACING.sm,
  },
  emptyMessage: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});

export default Gallery;
