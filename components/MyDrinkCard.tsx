import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

// @ts-ignore
const MyDrinkCard = ({ title, date }) => {
  return (
    <View style={styles.card}>
      <Image source={require('../assets/boba2.jpg')} style={styles.image} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 150,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    margin: 10,
  },
  image: {
    width: '100%',
    height: '65%',
  },
  textContainer: {
    padding: 12,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
});

export default MyDrinkCard;
