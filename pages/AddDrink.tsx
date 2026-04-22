import React, { useState, useCallback } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import database from '../database/index.native';
import Drink from '../database/model/Drink';
import { uploadImage, syncToCloud, getPlaceDetails, PlacePrediction } from '../services';
import { useCurrentUser } from '../hooks';
import { FormField, Button, StoreAutocomplete, GradientBackground } from '../components';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, RATINGS, DEFAULT_IMAGES } from '@/constants';
import { DrinkForm } from '@/types';

const INITIAL_FORM: DrinkForm = {
  flavor: '',
  price: '',
  store: '',
  occasion: '',
  rating: null,
  imageUri: null,
  latitude: null,
  longitude: null,
  placeId: null,
};

const AddDrink: React.FC = () => {
  const [form, setForm] = useState<DrinkForm>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const { user } = useCurrentUser();

  const updateField = <K extends keyof DrinkForm>(field: K, value: DrinkForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Handle store selection from autocomplete
  const handleStoreSelect = useCallback(async (store: PlacePrediction) => {
    setForm((prev) => ({ ...prev, store: store.name, placeId: store.placeId }));

    // Fetch place details to get coordinates
    try {
      const details = await getPlaceDetails(store.placeId);
      if (details) {
        setForm((prev) => ({
          ...prev,
          latitude: details.latitude,
          longitude: details.longitude,
        }));
      }
    } catch (error) {
      console.warn('Could not fetch place details:', error);
    }
  }, []);

  const validateForm = (): string | null => {
    if (!form.flavor.trim()) return 'Please enter a flavor';
    const numericPrice = parseFloat(form.price);
    if (isNaN(numericPrice) || numericPrice <= 0) return 'Please enter a valid price';
    if (!form.store.trim()) return 'Please enter store';
    if (!form.occasion.trim()) return 'Please enter occasion';
    if (form.rating === null) return 'Please select a rating';
    if (!form.imageUri) return 'Please select an image';
    return null;
  };

  const saveDrink = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Unable to save drink. Please try again.');
      return;
    }

    setSaving(true);

    try {
      const fileName = `drink_${Date.now()}.jpg`;
      const { s3Key, url } = await uploadImage(form.imageUri!, fileName);

      await database.write(async () => {
        await database.collections.get<Drink>('drinks').create((drink) => {
          drink.flavor = form.flavor.trim();
          drink.price = parseFloat(form.price);
          drink.store = form.store.trim();
          drink.occasion = form.occasion.trim();
          drink.rating = form.rating!;
          drink.date = new Date().toISOString().slice(0, 10);
          drink.photoUrl = url;
          drink.s3Key = s3Key;
          drink.userId = user.identityId;
          drink.synced = false;
          drink.lastModified = new Date();
          drink.latitude = form.latitude;
          drink.longitude = form.longitude;
          drink.placeId = form.placeId;
        });
      });

      // Only sync to cloud for authenticated users (not local users)
      await syncToCloud();
      Alert.alert('Success', 'Your boba drink has been logged!');
      setForm(INITIAL_FORM);
    } catch (e) {
      console.error('Error saving drink:', e);
      Alert.alert('Error', 'Failed to save drink. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      updateField('imageUri', result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      updateField('imageUri', result.assets[0].uri);
    }
  };

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Image
          source={form.imageUri ? { uri: form.imageUri } : DEFAULT_IMAGES.boba}
          style={styles.imagePlaceholder}
        />

        <View style={styles.buttonRow}>
          <View style={styles.buttonWrapper}>
            <Button title="Take Photo" onPress={takePhoto} variant="secondary" />
          </View>
          <View style={styles.buttonWrapper}>
            <Button title="Choose Photo" onPress={pickImage} variant="outline" />
          </View>
        </View>

        <FormField
          label="Flavor"
          placeholder="e.g. Strawberry Matcha Latte"
          value={form.flavor}
          onChangeText={(text: string) => updateField('flavor', text)}
        />

        <FormField
          label="Price"
          placeholder="e.g. 5.99"
          value={form.price}
          onChangeText={(text: string) => {
            if (/^\d*\.?\d*$/.test(text)) updateField('price', text);
          }}
          keyboardType="numeric"
        />

        <StoreAutocomplete
          value={form.store}
          onChangeText={(text: string) => updateField('store', text)}
          onSelectStore={handleStoreSelect}
          placeholder="Search for a boba shop..."
        />

        <FormField
          label="What is the occasion?"
          placeholder="e.g. Celebrating that I passed my exam!"
          value={form.occasion}
          onChangeText={(text: string) => updateField('occasion', text)}
        />

        <Text style={styles.label}>Rating</Text>
        <View style={styles.ratingContainer}>
          {RATINGS.map(({ value, emoji }) => (
            <TouchableOpacity
              key={value}
              onPress={() => updateField('rating', value)}
              style={[styles.emojiButton, form.rating === value && styles.selectedEmojiButton]}
              activeOpacity={0.7}>
              <Text style={styles.emoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Log My Boba!"
          onPress={saveDrink}
          loading={saving}
          disabled={saving}
          style={styles.submitButton}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  backButton: {
    padding: SPACING.sm,
  },
  backButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text.accent,
  },
  placeholder: {
    width: 60,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#f5f5f5',
    marginBottom: SPACING.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
    width: '100%',
  },
  buttonWrapper: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: SPACING.lg,
  },
  emojiButton: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.sm,
  },
  emoji: {
    fontSize: FONT_SIZES.xxxl,
  },
  selectedEmojiButton: {
    backgroundColor: COLORS.secondary,
  },
  submitButton: {
    marginTop: SPACING.xl,
    width: '100%',
  },
});

export default AddDrink;
