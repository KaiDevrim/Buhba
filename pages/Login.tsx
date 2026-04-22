import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_SIZES, SHADOWS, SPACING } from '@/constants';
import React, { useState } from 'react';
import { signInWithRedirect } from 'aws-amplify/auth';
import { Image } from 'expo-image';
import { fastSignOut } from '@/utils/auth';

interface LoginProps {
  onSkipLogin?: () => void;
}

const Login: React.FC<LoginProps> = ({ onSkipLogin }) => {
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
        // Attempt to clean up the hung sign out process automatically and prompt them to try again.
        try {
          await fastSignOut();
        } catch {
          // Ignore subsequent error
        }
        setError('Clearing previous session... Please try again.');
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
            <Image source={require('../assets/g-logo.png')} style={authStyles.googleIcon} />
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

export default Login;
