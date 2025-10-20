import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';

// @ts-ignore
export default function BottomBar({ state, navigation }) {
  const activeRouteName = state.routes[state.index].name;

  return (
    <View style={styles.bottomBar}>
      <TouchableOpacity onPress={() => navigation.navigate('Gallery')}>
        <View style={styles.tabItem}>
          <AntDesign style={styles.icon} name="home" size={24} color={activeRouteName === 'Gallery' ? 'orange' : 'white'} />
          <Text style={{ color: activeRouteName === 'Gallery' ? 'orange' : 'white' }}>Home</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('AddDrink')}>
        <View style={styles.tabItem}>
          <AntDesign style={styles.icon} name="plus-circle" size={24} color={activeRouteName === 'AddDrink' ? 'orange' : 'white'} />
          <Text style={{ color: activeRouteName === 'AddDrink' ? 'orange' : 'white' }}>Add Boba</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Stats')}>
        <View style={styles.tabItem}>
          <AntDesign style={styles.icon} name="line-chart" size={24} color={activeRouteName === 'Stats' ? 'orange' : 'white'} />
          <Text style={{ color: activeRouteName === 'Stats' ? 'orange' : 'white' }}>Stats</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    display: 'flex',
    flexDirection: 'row',
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    backgroundColor: "#583B39",
    borderRadius: 20,
    height: 80,
    paddingHorizontal: 10,
    // Shadow styles
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  tabItem: {
    display: 'flex',
    marginHorizontal: 32,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    paddingVertical: 10,
  }
});