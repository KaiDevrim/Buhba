import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { StatsCard, EmptyState, GradientBackground } from '../components';
import { useFocusedDrinks } from '../hooks';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/constants';
import type { StatsData } from '@/types';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const Stats: React.FC = () => {
  const { drinks } = useFocusedDrinks();

  const stats: StatsData = useMemo(() => {
    const storeVisits = new Map<string, number>();
    let totalSpent = 0;

    drinks.forEach((drink) => {
      totalSpent += drink.price;
      storeVisits.set(drink.store, (storeVisits.get(drink.store) || 0) + 1);
    });

    const topStores = [...storeVisits.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

    return {
      drinkCount: drinks.length,
      storeCount: storeVisits.size,
      totalSpent,
      topStores,
    };
  }, [drinks]);

  if (stats.drinkCount === 0) {
    return <EmptyState title="Your Boba Stats" message="Add more boba to see your stats" />;
  }

  const averagePrice = stats.totalSpent / stats.drinkCount;

  return (
    <GradientBackground>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Your Boba Stats</Text>

        <View style={styles.cardsRow}>
          <StatsCard icon="🧋" number={stats.drinkCount} label="DRINKS" />
          <StatsCard icon="🏪" number={stats.storeCount} label="STORES" />
        </View>

        <View style={styles.cardsRow}>
          <StatsCard icon="💰" number={formatCurrency(stats.totalSpent)} label="SPENT" />
          <StatsCard icon="📊" number={`$${averagePrice.toFixed(2)}`} label="AVG PRICE" />
        </View>

        {stats.topStores.length > 0 && (
          <View style={styles.topStoresContainer}>
            <Text style={styles.sectionTitle}>Your Top Stores</Text>
            {stats.topStores.map(([store, count], index) => (
              <Text key={store} style={styles.storeText}>
                {index + 1}. {store} ({count} visit{count > 1 ? 's' : ''})
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 80,
    paddingBottom: SPACING.xxl * 2,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.xl,
    color: COLORS.text.accent,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  topStoresContainer: {
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.text.accent,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text.accent,
    marginBottom: SPACING.sm,
  },
  storeText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.accent,
    marginBottom: SPACING.xs,
  },
});

export default Stats;
