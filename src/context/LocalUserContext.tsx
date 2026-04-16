import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  clearLocalUserFlag,
  isLocalUser as readLocalUserFlag,
  setLocalUserFlag,
} from '../utils/localUser';

interface LocalUserContextType {
  isLocalUser: boolean;
  setLocalUser: (value: boolean) => void;
  clearLocalUser: () => Promise<void>;
}

const LocalUserContext = createContext<LocalUserContextType | undefined>(undefined);

export const LocalUserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [localMode, setLocalMode] = useState(false);

  // Load local user preference on mount
  useEffect(() => {
    readLocalUserFlag().then((value) => {
      if (value) {
        setLocalMode(true);
      }
    });
  }, []);

  const setLocalUser = useCallback((value: boolean) => {
    setLocalMode(value);
    if (value) {
      void setLocalUserFlag();
      return;
    }
    void clearLocalUserFlag();
  }, []);

  const clearLocalUser = useCallback(async () => {
    setLocalMode(false);
    await clearLocalUserFlag();
  }, []);

  return (
    <LocalUserContext.Provider value={{ isLocalUser: localMode, setLocalUser, clearLocalUser }}>
      {children}
    </LocalUserContext.Provider>
  );
};

export const useLocalUser = (): LocalUserContextType => {
  const context = useContext(LocalUserContext);
  if (context === undefined) {
    throw new Error('useLocalUser must be used within a LocalUserProvider');
  }
  return context;
};

/**
 * Check if the user is using the app locally (without sign-in)
 * Can be used outside of React components
 */
export const checkIsLocalUser = async (): Promise<boolean> => {
  return readLocalUserFlag();
};
