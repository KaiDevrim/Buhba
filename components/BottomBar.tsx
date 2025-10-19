import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Image, Platform } from 'react-native';
import Gallery from '../pages/Gallery';
import AddDrink from '../pages/AddDrink';
import Stats from '../pages/Stats';
import AntDesign from '@expo/vector-icons/AntDesign';

const Tab = createBottomTabNavigator();

// @ts-ignore
const TabIcon = ({ source, label, focused }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 10 }}>
    <Image
      source={source}
      style={{
        width: 20,
        height: 20,
        tintColor: focused ? 'red' : '#777',
        resizeMode: 'contain',
        marginTop: Platform.OS === 'web' ? 5 : 24,
      }}
    />
    <Text
      style={{
        fontSize: 10,
        color: focused ? 'red' : '#777',
        textAlign: 'center',
        marginTop: 4,
        width:100
      }}
    >
      {label}
    </Text>

    <View
      style={{
        height: 3,
        width: 100,
        backgroundColor: focused ? 'red' : 'transparent',
        marginTop: 6,
        borderRadius: 1,
      }}
    />
  </View>
);



export default function BottomTabNavigator() {
  return (

    <Tab.Navigator screenOptions={{
      headerShown: false,
      tabBarShowLabel: false,
      tabBarStyle: {
        height: 60, // Adjust height here
      },
    }}>
      <Tab.Screen
        name="Home"
        component={Gallery}
        options={{
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Task"
        component={AddDrink}
        options={{
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Report"
        component={Stats}
        options={{
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="home" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}