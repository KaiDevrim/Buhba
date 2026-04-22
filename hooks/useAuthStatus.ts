import { useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { getCurrentUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

import { isLocalUser, setLocalUserFlag } from '@/utils/localUser';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'local';

interface UseAuthStatusResult {
  status: AuthStatus;
  setLocalUser: () => Promise<void>;
  clearLocalUser: () => Promise<void>;
}

const AUTH_TIMEOUT_MS = 5000;

export const useAuthStatus = (): UseAuthStatusResult => {
  const [status, setStatus] = useState<AuthStatus>('loading');

  const setLocalUser = async () => {
    await setLocalUserFlag();
    setStatus('local');
  };

  const clearLocalUser = async () => {
    setStatus('unauthenticated');
  };

  useEffect(() => {
    let isMounted = true;
    let authCheckFinished = false;

    const setStatusIfMounted = (nextStatus: AuthStatus) => {
      if (!isMounted) {
        return;
      }
      setStatus((currentStatus) => (currentStatus === nextStatus ? currentStatus : nextStatus));
    };

    const checkAuth = async () => {
      if (await isLocalUser()) {
        setStatusIfMounted('local');
        authCheckFinished = true;
        return;
      }

      try {
        await getCurrentUser();
        setStatusIfMounted('authenticated');
      } catch {
        setStatusIfMounted('unauthenticated');
      } finally {
        authCheckFinished = true;
        clearTimeout(timeoutId);
      }
    };

    const timeoutId = setTimeout(() => {
      if (!authCheckFinished) {
        setStatusIfMounted('unauthenticated');
      }
    }, AUTH_TIMEOUT_MS);

    void checkAuth();

    const localUserListener = DeviceEventEmitter.addListener('local-user-changed', (isLocal) => {
      if (isLocal) {
        setStatusIfMounted('local');
      } else {
        setStatusIfMounted('unauthenticated');
      }
    });

    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      const event = (payload as { event?: string }).event;

      if (event === 'signedIn' || event === 'signInWithRedirect') {
        // Redirect events can fire before auth state is fully available.
        void getCurrentUser()
          .then(() => setStatusIfMounted('authenticated'))
          .catch(() => setStatusIfMounted('unauthenticated'));
      }

      if (event === 'signedOut' || event === 'signInWithRedirect_failure') {
        setStatusIfMounted('unauthenticated');
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      unsubscribe();
      localUserListener.remove();
    };
  }, []);

  return { status, setLocalUser, clearLocalUser };
};
