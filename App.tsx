import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as WatermelonDatabaseProvider from '@nozbe/watermelondb/DatabaseProvider';
import { signInWithRedirect } from 'aws-amplify/auth';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';

import { configureAmplify } from '@/config';
import { RootStackParamList, TabParamList } from '@/types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '@/constants';
import { LocalUserProvider } from '@/context';
import database from './database/index.native';
import { BottomBar } from './components';
import Gallery from './pages/Gallery';
import AddDrink from './pages/AddDrink';
import Stats from './pages/Stats';
import DrinkDetail from './pages/DrinkDetail';
import EditDrink from './pages/EditDrink';
import Profile from './pages/Profile';
import { syncFromCloud } from './services';
import { useAuthStatus } from './hooks';

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
    <Tab.Screen name="Gallery" component={Gallery} />
    <Tab.Screen name="AddDrink" component={AddDrink} />
    <Tab.Screen name="Stats" component={Stats} />
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
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </DatabaseProvider>
    </LocalUserProvider>
  );
};

const CustomSignIn: React.FC<{ onSkipLogin: () => void | Promise<void> }> = ({ onSkipLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithRedirect({ provider: 'Google' });
    } catch (err) {
      const authError = err as { name?: string; message?: string };
      if (authError.name === 'UserAlreadyAuthenticatedException') {
        setError('You are already signed in. Please wait a moment...');
        setIsLoading(false);
        return;
      }

      if (__DEV__) {
        console.error('Google sign in error:', err);
      }
      setError('Failed to sign in with Google. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <View style={authStyles.container}>
      <Text style={authStyles.title}>🧋 BobaPal</Text>
      <Text style={authStyles.subtitle}>Track your boba adventures</Text>

      {error && <Text style={authStyles.errorText}>{error}</Text>}

      <TouchableOpacity
        style={[authStyles.googleButton, isLoading && authStyles.googleButtonDisabled]}
        onPress={handleGoogleSignIn}
        disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator size="small" color={COLORS.text.primary} />
        ) : (
          <>
            <Image
              source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
              style={authStyles.googleIcon}
            />
            <Text style={authStyles.googleButtonText}>Continue with Google</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={authStyles.skipButton} onPress={onSkipLogin} disabled={isLoading}>
        <Text style={authStyles.skipButtonText}>Use without account</Text>
      </TouchableOpacity>

      <Text style={authStyles.skipHint}>Your data will be stored locally only</Text>
    </View>
  );
};

const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundAlt,
    padding: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.text.accent,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.secondary,
    marginBottom: 40,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    color: '#dc2626',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xxl,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 250,
    ...SHADOWS.sm,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: SPACING.md,
  },
  googleButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  skipButton: {
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
  },
  skipButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    textDecorationLine: 'underline',
  },
  skipHint: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.light,
    textAlign: 'center',
  },
});

const App: React.FC = () => {
  const { status: authStatus, setLocalUser } = useAuthStatus();

  if (authStatus === 'loading') {
    return (
      <View style={[authStyles.container, { backgroundColor: '#FFF8F0' }]}>
        <ActivityIndicator size="large" color="#FF9800" />
        <Text style={[authStyles.subtitle, { color: '#666666', marginTop: 20 }]}>Loading...</Text>
      </View>
    );
  }

  if (authStatus === 'authenticated') {
    return <AuthenticatedApp isLocalUser={false} />;
  }

  if (authStatus === 'local') {
    return <AuthenticatedApp isLocalUser={true} />;
  }

  return <CustomSignIn onSkipLogin={setLocalUser} />;
};

export default App;
