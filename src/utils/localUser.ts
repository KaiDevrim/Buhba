import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOCAL_USER_KEY } from '@/constants/storageKeys';

export const LOCAL_USER_ID = 'local-user';

export const isLocalUser = async (): Promise<boolean> => {
  const value = await AsyncStorage.getItem(LOCAL_USER_KEY);
  return value === 'true';
};

export const setLocalUserFlag = async (): Promise<void> => {
  await AsyncStorage.setItem(LOCAL_USER_KEY, 'true');
};

export const clearLocalUserFlag = async (): Promise<void> => {
  await AsyncStorage.removeItem(LOCAL_USER_KEY);
};

