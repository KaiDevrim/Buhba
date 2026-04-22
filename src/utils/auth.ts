import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Perform a fast, local-only sign out by wiping all AWS/Amplify related keys
 * from AsyncStorage.
 * This avoids the slow browser-based SSO sign-out which creates a poor UX
 * and leads to "UserAlreadyAuthenticatedException".
 */
export async function fastSignOut() {
  try {
    const keys = await AsyncStorage.getAllKeys();

    // Amplify v6 stores tokens and state using these namespaces
    const keysToRemove = keys.filter(
      (key) =>
        key.includes('CognitoIdentityServiceProvider') ||
        key.includes('amplify-') ||
        key.includes('oauth') ||
        key.includes('aws-amplify')
    );

    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
  } catch (error) {
    if (__DEV__) {
      console.error('fastSignOut error:', error);
    }
  }
}
