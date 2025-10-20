import React from 'react';
import BottomBar from './components/BottomBar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Gallery from './pages/Gallery';
import AddDrink from './pages/AddDrink';
import Stats from './pages/Stats';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <NavigationContainer>
          <Tab.Navigator tabBar={(props) => <BottomBar {...props} />}>
            <Tab.Screen name="Gallery" component={Gallery} options={{ headerShown: false }} />
            <Tab.Screen name="AddDrink" component={AddDrink} options={{ headerShown: false }} />
            <Tab.Screen name="Stats" component={Stats} options={{ headerShown: false }} />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
