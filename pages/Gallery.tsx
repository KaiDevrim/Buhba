import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import MyDrinkCard from '../components/MyDrinkCard';

const Gallery = () => {
  const drinks = [
    { title: "Strawberry Matcha Latte", date: "01/01/25" },
    { title: "Strawberry Matcha Latte", date: "01/01/25" },
    { title: "Strawberry Matcha Latte", date: "01/01/25" },
    { title: "Strawberry Matcha Latte", date: "01/01/25" },
    { title: "Strawberry Matcha Latte", date: "01/01/25" },
    // Add more items here as needed for your gallery
  ];

  // @ts-ignore
  const renderItem = ({ item }) => (
    <MyDrinkCard title={item.title} date={item.date} />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={drinks}
        renderItem={renderItem}
        numColumns={2}
        keyExtractor={(item, index) => index.toString()}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  row: {
    justifyContent: 'space-between',
  },
  list: {
    paddingBottom: 20,
  },
});

export default Gallery;
