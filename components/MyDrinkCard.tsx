import React, { memo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useS3Image } from '../hooks';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '@/constants';

interface MyDrinkCardProps {
  title: string;
  date: string;
  s3Key: string | null;
  photoUrl?: string | null;
}

// Placeholder blur hash for boba-colored loading state
const PLACEHOLDER_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0LMD%s:';

// Calculate card width based on screen width (2 columns with padding)
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.sm) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.25;

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
  } catch {
    return dateString;
  }
};

const MyDrinkCard: React.FC<MyDrinkCardProps> = memo(({ title, date, s3Key, photoUrl }) => {
  const { imageUrl } = useS3Image(s3Key, photoUrl);

  return (
    <View style={styles.card}>
      <Image
        source={
          imageUrl ? { uri: imageUrl, cacheKey: s3Key ?? undefined } : require('../assets/boba.jpg')
        }
        style={styles.image}
        placeholder={{ blurhash: PLACEHOLDER_BLURHASH }}
        contentFit="cover"
        transition={200}
        cachePolicy="disk"
      />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.gradient} />
      <View style={styles.contentOverlay}>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.date}>{formatDate(date)}</Text>
        </View>
        <View style={styles.infoButton}>
          <Text style={styles.infoIcon}>ⓘ</Text>
        </View>
      </View>
    </View>
  );
});

MyDrinkCard.displayName = 'MyDrinkCard';

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  textContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  date: {
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255, 255, 255, 0.85)',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  infoButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 14,
    color: '#FFFFFF',
  },
});

export default MyDrinkCard;
