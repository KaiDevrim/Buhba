import React from 'react';
import BottomBar from './components/BottomBar';
import { NavigationContainer } from '@react-navigation/native';


export default function App() {
  return (
    <NavigationContainer>
      <BottomBar />
    </NavigationContainer>
  );
}