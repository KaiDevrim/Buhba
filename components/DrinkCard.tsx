import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface DrinkCardProps {
  title: string;
  date: string;
}

export const DrinkCard: React.FC<DrinkCardProps> = ({ title, date }) => {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Image source={require('../assets/boba2.jpg')} style={styles.imgSrc} />
      </View>
      <View style={styles.content}>
        <View style={styles.forecast}>
          <View style={styles.separator}></View>
          <View style={styles.text}>
            <Text>Strawberry Matcha Latte</Text>
            <Text>10/01/25</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    width: 20,
    height: 35,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'white'
  },
  imgSrc: {
    width: 50,
    height: 50,
    objectFit: 'fill'
  },
  section: {
    position: 'relative',
    width: '100%',
    height: '70%',
  },
  content: {},
  forecast: {},
  separator: {},
  text: {}
})

// Usage example:
// <DrinkCard
//   imageUrl="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2F25174313.fs1.hubspotusercontent-eu1.net%2Fhub%2F25174313%2Fhubfs%2Fassets_moneymax%2Fcheesecake-macao.jpg%3Fwidth%3D1800%26height%3D2250%26name%3Dcheesecake-macao.jpg&f=1&nofb=1&ipt=1c340c392810a80e3b4d91ea21154405febf8ef0d324f688140c553cd4e3df2d"
//   title="Strawberry Matcha Latte"
//   date="10/01/25"
// />
