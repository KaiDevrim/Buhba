import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import database from '../../database/index.native';
import Drink from '../../database/model/Drink';
import { LOCAL_USER_ID, isLocalUser } from '@/utils/localUser';

export interface ProfileUserInfo {
  email: string | null;
  signInMethod: string;
  userId: string;
  isLocalUser: boolean;
}

export const LOCAL_USER_INFO: ProfileUserInfo = {
  email: null,
  signInMethod: 'Local',
  userId: LOCAL_USER_ID,
  isLocalUser: true,
};

const getSignInMethod = (payload: Record<string, unknown>): string => {
  let signInMethod = 'Email';

  const identities = payload.identities as string | undefined;
  const username = payload['cognito:username'] as string | undefined;

  if (identities) {
    try {
      const parsedIdentities = JSON.parse(identities) as { providerName?: string }[];
      const provider = parsedIdentities[0]?.providerName;
      if (provider === 'Google') return 'Google';
      if (provider === 'Facebook') return 'Facebook';
      if (provider === 'SignInWithApple') return 'Apple';
      if (provider) return provider;
    } catch {
      // Ignore bad identities payload and continue to username fallback.
    }
  }

  if (username) {
    if (username.startsWith('Google_') || username.startsWith('google_')) {
      signInMethod = 'Google';
    } else if (username.startsWith('Facebook_') || username.startsWith('facebook_')) {
      signInMethod = 'Facebook';
    } else if (username.startsWith('SignInWithApple_') || username.startsWith('apple_')) {
      signInMethod = 'Apple';
    }
  }

  return signInMethod;
};

export const fetchProfileUserInfo = async (): Promise<ProfileUserInfo | null> => {
  if (await isLocalUser()) {
    return LOCAL_USER_INFO;
  }

  try {
    const user = await getCurrentUser();
    const session = await fetchAuthSession();

    const payload = (session.tokens?.idToken?.payload || {}) as Record<string, unknown>;

    return {
      email: (payload.email as string) || null,
      signInMethod: getSignInMethod(payload),
      userId: user.userId,
      isLocalUser: false,
    };
  } catch {
    if (await isLocalUser()) {
      return LOCAL_USER_INFO;
    }
    return null;
  }
};

export const clearLocalDrinks = async (): Promise<void> => {
  const allDrinks = await database.collections.get<Drink>('drinks').query().fetch();
  const localDrinks = allDrinks.filter((drink) => drink.userId === LOCAL_USER_ID);

  await database.write(async () => {
    for (const drink of localDrinks) {
      await drink.destroyPermanently();
    }
  });
};
