import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import database from '../database';
import Drink from '../database/model/Drink';

export const useFocusedDrinks = () => {
  const [drinks, setDrinks] = useState<Drink[]>([]);

  const fetchDrinks = useCallback(async () => {
    try {
      const allDrinks = await database.collections.get<Drink>('drinks').query().fetch();
      setDrinks(allDrinks);
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to fetch drinks:', error);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDrinks();
    }, [fetchDrinks])
  );

  return { drinks, refetchDrinks: fetchDrinks };
};
