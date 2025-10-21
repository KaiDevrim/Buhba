import React, { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AddDrink = () => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [flavorText, setFlavorText] = useState<string | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [occasion, setOccasion] = useState<string | null>(null);
  const [store, setStore] = useState<string | null>(null);
  return (
    <SafeAreaView style={styles.container}>
      {/* Image Placeholder */}
      <Image source={require("../assets/boba.jpg")} style={styles.imagePlaceholder} />

      {/* Photo Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Choose Photo</Text>
        </TouchableOpacity>
      </View>

      {/* Flavor Input */}
      <Text style={styles.label}>Flavor</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Strawberry Matcha Latte"
        placeholderTextColor="#999"
        onChangeText={newFlavor => setFlavorText(newFlavor)}
      />

      {/* Price Input */}
      <Text style={styles.label}>Price</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. $00.00"
        placeholderTextColor="#999"
        keyboardType="numeric"
        onChangeText={text => {
          const numericPrice = parseFloat(text);
          setPrice(isNaN(numericPrice) ? 0 : numericPrice);
        }}
      />

      {/* Store Input */}
      <Text style={styles.label}>Store</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Tsaocaa"
        placeholderTextColor="#999"
        onChangeText={newStore => setStore(newStore)}
      />

      {/* Occasion Input */}
      <Text style={styles.label}>What is the occasion?</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Celebrating that I passed my exam!"
        placeholderTextColor="#999"
        onChangeText={newOccasion => setOccasion(newOccasion)}
      />

      {/* Rating */}
      <Text style={styles.label}>Rating</Text>
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4].map((rating) => (
          <TouchableOpacity
            key={rating}
            style={styles.emojiButton}
            onPress={() => setSelectedRating(rating)}
          >
            <Text style={styles.emoji}>
              {rating === 1 && '😞'}
              {rating === 2 && '😐'}
              {rating === 3 && '🙂'}
              {rating === 4 && '😊'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton}>
        <Text style={styles.submitButtonText}>Log My Boba!</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 100,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  placeholderText: {
    color: '#ccc',
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#4A90E2',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '500',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    alignSelf: 'flex-start',
    marginBottom: 0,
    marginTop: 0,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 15,
    backgroundColor: 'white',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 15,
    marginVertical: 15,
  },
  emojiButton: {
    padding: 5,
  },
  emoji: {
    fontSize: 32,
  },
  submitButton: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddDrink;
