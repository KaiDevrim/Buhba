import { useState, useEffect, useCallback } from 'react';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import type { UserInfo } from '@/types';
import { isLocalUser as readLocalUserFlag, LOCAL_USER_ID } from '../src/utils/localUser';

interface UseCurrentUserResult {
  user: UserInfo | null;
  loading: boolean;
  isLocalUser: boolean;
  refetch: () => Promise<void>;
}

export const useCurrentUser = (): UseCurrentUserResult => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [localMode, setLocalMode] = useState(false);

  const setLocalUserState = () => {
    setLocalMode(true);
    setUser({
      userId: LOCAL_USER_ID,
      identityId: LOCAL_USER_ID,
      email: undefined,
    });
  };

  const setCloudUserState = (
    currentUser: Awaited<ReturnType<typeof getCurrentUser>>,
    identityId: string | undefined
  ) => {
    setLocalMode(false);
    setUser({
      userId: currentUser.userId,
      identityId: identityId || '',
      email: currentUser.signInDetails?.loginId,
    });
  };

  const fetchUser = useCallback(async () => {
    try {
      if (await readLocalUserFlag()) {
        setLocalUserState();
        setLoading(false);
        return;
      }

      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();
      setCloudUserState(currentUser, session.identityId);
    } catch (err) {
      if (__DEV__) {
        console.error('Failed to fetch current user:', err);
      }

      if (await readLocalUserFlag()) {
        setLocalUserState();
      } else {
        setLocalMode(false);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    const listener = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn') {
        fetchUser();
      }
      if (payload.event === 'signedOut') {
        setUser(null);
        setLocalMode(false);
      }
    });

    return () => listener();
  }, [fetchUser]);

  return { user, loading, isLocalUser: localMode, refetch: fetchUser };
};
