import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import database from '../database/index.native';
import Drink from '../database/model/Drink';
import { uploadImage, deleteImage , syncToCloud } from '../services';
import { useCurrentUser , useS3Image } from '../hooks';
import {
  FormField,
  Button,
  LoadingState,
  StoreAutocomplete,
  GradientBackground,
} from '../components';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS , RATINGS } from '@/constants';
import { RootStackParamList } from '@/types';
import type { DrinkForm } from '@/types';

const PLACEHOLDER_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0LMD%s:';

const EditDrink: React.FC = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'EditDrink'>>();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { drinkId } = route.params;
  const { user } = useCurrentUser();

  const [drink, setDrink] = useState<Drink | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<DrinkForm>({
    flavor: '',
    price: '',
    store: '',
    occasion: '',
    rating: null,
    imageUri: null,
    latitude: null,
    longitude: null,
    placeId: null,
  });
  const [newImageUri, setNewImageUri] = useState<string | null>(null);

  // Pass photoUrl as second argument for local images
  const { imageUrl } = useS3Image(drink?.s3Key ?? null, drink?.photoUrl);

  // Fetch the drink data
  useEffect(() => {
    const fetchDrink = async () => {
      try {
        const drinkItem = await database.collections.get<Drink>('drinks').find(drinkId);
        setDrink(drinkItem);
        setForm({
          flavor: drinkItem.flavor,
          price: drinkItem.price.toString(),
          store: drinkItem.store,
          occasion: drinkItem.occasion,
          rating: drinkItem.rating,
          imageUri: null,
          latitude: drinkItem.latitude,
          longitude: drinkItem.longitude,
          placeId: drinkItem.placeId,
        });
      } catch (error) {
        if (__DEV__) {
          console.error('Failed to fetch drink:', error);
        }
        Alert.alert('Error', 'Failed to load drink');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    fetchDrink();
  }, [drinkId, navigation]);

  const updateField = <K extends keyof DrinkForm>(field: K, value: DrinkForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string | null => {
    if (!form.flavor.trim()) return 'Please enter a flavor';
    const numericPrice = parseFloat(form.price);
    if (isNaN(numericPrice) || numericPrice <= 0) return 'Please enter a valid price';
    if (!form.store.trim()) return 'Please enter store';
    if (!form.occasion.trim()) return 'Please enter occasion';
    if (form.rating === null) return 'Please select a rating';
    return null;
  };

  const saveChanges = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    if (!user || !drink) {
      Alert.alert('Error', 'Not authenticated or drink not found');
      return;
    }

    setSaving(true);

    try {
      let s3Key = drink.s3Key;
      let photoUrl = drink.photoUrl;

      // If a new image was selected, upload it
      if (newImageUri) {
        // Delete old image if exists
        if (drink.s3Key) {
          try {
            await deleteImage(drink.s3Key);
          } catch (e) {
            console.warn('Failed to delete old image:', e);
          }
        }

        const fileName = `drink_${Date.now()}.jpg`;
        const uploadResult = await uploadImage(newImageUri, fileName);
        s3Key = uploadResult.s3Key;
        photoUrl = uploadResult.url;
      }

      await database.write(async () => {
        await drink.update((d) => {
          d.flavor = form.flavor.trim();
          d.price = parseFloat(form.price);
          d.store = form.store.trim();
          d.occasion = form.occasion.trim();
          d.rating = form.rating!;
          d.photoUrl = photoUrl;
          d.s3Key = s3Key;
          d.synced = false;
          d.lastModified = new Date();
        });
      });

      await syncToCloud();
      Alert.alert('Success', 'Drink updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      if (__DEV__) {
        console.error('Error updating drink:', e);
      }
      Alert.alert('Error', 'Failed to update drink. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteDrink = async () => {
    Alert.alert(
      'Delete Drink',
      'Are you sure you want to delete this drink? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!drink) return;

            setDeleting(true);
            try {
              // Delete image from S3 if exists
              if (drink.s3Key) {
                try {
                  await deleteImage(drink.s3Key);
                } catch (e) {
                  console.warn('Failed to delete image:', e);
                }
              }

              // Delete from database
              await database.write(async () => {
                await drink.destroyPermanently();
              });

              await syncToCloud();
              Alert.alert('Deleted', 'Drink has been deleted.', [
                { text: 'OK', onPress: () => navigation.navigate('MainTabs') },
              ]);
            } catch (e) {
              if (__DEV__) {
                console.error('Error deleting drink:', e);
              }
              Alert.alert('Error', 'Failed to delete drink.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setNewImageUri(result.assets[0].uri);
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
      setNewImageUri(result.assets[0].uri);
    }
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

  // Determine which image to show
  const displayImageSource = newImageUri
    ? { uri: newImageUri }
    : imageUrl
      ? { uri: imageUrl }
      : require('../assets/boba.jpg');

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Edit Drink</Text>

        <View style={styles.imageContainer}>
          <Image
            source={displayImageSource}
            style={styles.image}
            placeholder={{ blurhash: PLACEHOLDER_BLURHASH }}
            contentFit="cover"
            transition={200}
          />
        </View>

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
          title="Save Changes"
          onPress={saveChanges}
          loading={saving}
          disabled={saving || deleting}
          style={styles.saveButton}
        />

        <Button
          title="Delete Drink"
          onPress={deleteDrink}
          loading={deleting}
          disabled={saving || deleting}
          variant="outline"
          style={styles.deleteButton}
        />
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: 80,
    paddingBottom: 100,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.lg,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
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
    marginBottom: SPACING.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: SPACING.md,
    width: '100%',
  },
  emojiButton: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#f5f5f5',
    marginHorizontal: SPACING.xs,
  },
  selectedEmojiButton: {
    backgroundColor: COLORS.primary,
  },
  emoji: {
    fontSize: FONT_SIZES.xxl,
  },
  saveButton: {
    width: '100%',
    marginTop: SPACING.lg,
  },
  deleteButton: {
    width: '100%',
    marginTop: SPACING.md,
    borderColor: '#ff4444',
  },
});

export default EditDrink;
