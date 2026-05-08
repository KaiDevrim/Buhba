import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as WatermelonDatabaseProvider from '@nozbe/watermelondb/DatabaseProvider';
import { configureAmplify } from '@/config';
import { RootStackParamList, TabParamList } from '@/types';
import { LocalUserProvider } from '@/context';
import database from './database/index.native';
import { BottomBar, LoadingState } from './components';
import AddDrink from './pages/AddDrink';
import Stats from './pages/Stats';
import DrinkDetail from './pages/DrinkDetail';
import EditDrink from './pages/EditDrink';
import Profile from './pages/Profile';
import Login from './pages/Login';
import { syncFromCloud } from './services';
import { useAuthStatus } from './hooks';
import Explore from './pages/Explore';
import Home from './pages/Home';
import { Gallery } from './pages';

try {
  configureAmplify();
} catch (error) {
  if (__DEV__) {
    console.error('Failed to configure Amplify:', error);
  }
}

// Re-export types for backward compatibility
export type { RootStackParamList, TabParamList };

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const databaseProviderModule = WatermelonDatabaseProvider as unknown as {
  DatabaseProvider?: unknown;
  default?: unknown;
};
const DatabaseProvider = (databaseProviderModule.DatabaseProvider ||
  databaseProviderModule.default ||
  databaseProviderModule) as React.ComponentType<{
  database: unknown;
  children?: React.ReactNode;
}>;

const MainTabs: React.FC = () => (
  <Tab.Navigator
    screenOptions={{ headerShown: false }}
    tabBar={(props) => <BottomBar {...props} />}>
    <Tab.Screen name="Home" component={Home} />
    <Tab.Screen name="AddDrink" component={AddDrink} />
    <Tab.Screen name="Stats" component={Stats} />
    <Tab.Screen name="Explore" component={Explore} />
  </Tab.Navigator>
);

const AuthenticatedApp: React.FC<{ isLocalUser: boolean }> = ({ isLocalUser }) => {
  useEffect(() => {
    if (!isLocalUser) {
      syncFromCloud().catch((error) => {
        if (__DEV__) {
          console.error('Sync error:', error);
        }
      });
    }
  }, [isLocalUser]);

  return (
    <LocalUserProvider>
      <DatabaseProvider database={database}>
        <SafeAreaProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen name="DrinkDetail" component={DrinkDetail} />
              <Stack.Screen name="EditDrink" component={EditDrink} />
              <Stack.Screen name="Profile" component={Profile} />
              <Stack.Screen name="Login" component={Login} />
              <Stack.Screen name={"Gallery"} component={Gallery} />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </DatabaseProvider>
    </LocalUserProvider>
  );
};

const App: React.FC = () => {
  const { status: authStatus, setLocalUser } = useAuthStatus();

  if (authStatus === 'loading') {
    return <LoadingState />;
  }

  if (authStatus === 'authenticated') {
    return <AuthenticatedApp isLocalUser={false} />;
  }

  if (authStatus === 'local') {
    return <AuthenticatedApp isLocalUser={true} />;
  }

  return <Login onSkipLogin={setLocalUser} />;
};

export default App;
