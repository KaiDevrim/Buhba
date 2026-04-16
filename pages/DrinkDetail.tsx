import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import database from '../database/index.native';
import Drink from '../database/model/Drink';
import { RootStackParamList } from '@/types';
import { useS3Image } from '../hooks';
import { LoadingState, DetailRow, Button, GradientBackground } from '../components';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS , RATING_EMOJIS } from '@/constants';

// Placeholder blur hash for loading state
const PLACEHOLDER_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0LMD%s:';

const DrinkDetail: React.FC = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'DrinkDetail'>>();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { drinkId } = route.params;
  const [drink, setDrink] = useState<Drink | null>(null);
  const [loading, setLoading] = useState(true);

  // Pass photoUrl as second argument for local images
  const { imageUrl } = useS3Image(drink?.s3Key ?? null, drink?.photoUrl);

  useEffect(() => {
    const fetchDrink = async () => {
      try {
        const drinkItem = await database.collections.get<Drink>('drinks').find(drinkId);
        setDrink(drinkItem);
      } catch (error) {
        if (__DEV__) {
          console.error('Failed to fetch drink:', error);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDrink();
  }, [drinkId]);

  const handleEdit = () => {
    navigation.navigate('EditDrink', { drinkId });
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!drink) {
    return (
      <GradientBackground>
        <View style={styles.loadingContainer}>
          <Text>Drink not found</Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageContainer}>
          <Image
            source={imageUrl ? { uri: imageUrl } : require('../assets/boba2.jpg')}
            style={styles.image}
            placeholder={{ blurhash: PLACEHOLDER_BLURHASH }}
            contentFit="cover"
            transition={300}
            cachePolicy="disk"
          />
        </View>

        <DetailRow label="Flavor" value={drink.flavor} />
        <DetailRow label="Price" value={`$${drink.price.toFixed(2)}`} />
        <DetailRow label="Store" value={drink.store} />
        <DetailRow label="Occasion" value={drink.occasion} />
        <DetailRow label="Date" value={drink.date} />

        <Text style={styles.label}>Rating</Text>
        <Text style={styles.ratingEmoji}>{RATING_EMOJIS[drink.rating] || '—'}</Text>

        <Button
          title="Edit Drink"
          onPress={handleEdit}
          variant="secondary"
          style={styles.editButton}
        />
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: 80,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: 200,
    height: 200,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#f5f5f5',
    marginBottom: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: BORDER_RADIUS.full,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
  },
  ratingEmoji: {
    fontSize: FONT_SIZES.title,
    marginTop: SPACING.sm,
  },
  editButton: {
    marginTop: SPACING.xxl,
    width: '100%',
  },
});

export default DrinkDetail;
