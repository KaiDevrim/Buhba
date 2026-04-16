import { uploadData, downloadData } from 'aws-amplify/storage';
import { fetchAuthSession } from 'aws-amplify/auth';
import database from '../database/index.native';
import Drink from '../database/model/Drink';
import type { DrinkData } from '@/types';
import { isLocalUser } from '@/utils/localUser';

const BACKUP_FILE = 'backup/drinks.json';

/**
 * Get the current user's identity ID
 */
const getUserId = async (): Promise<string> => {
  const session = await fetchAuthSession();
  if (!session.identityId) {
    throw new Error('No identity ID found');
  }
  return session.identityId;
};

/**
 * Convert a Drink model to a serializable DrinkData object
 */
const drinkToData = (drink: Drink): DrinkData => ({
  id: drink.id,
  flavor: drink.flavor,
  price: drink.price,
  store: drink.store,
  occasion: drink.occasion,
  rating: drink.rating,
  date: drink.date,
  s3Key: drink.s3Key,
  userId: drink.userId,
  lastModified: drink.lastModified?.getTime() || Date.now(),
});

/**
 * Sync local drinks to cloud storage
 */
export const syncToCloud = async (): Promise<void> => {
  // Skip sync for local users
  if (await isLocalUser()) {
    if (__DEV__) {
      console.log('[Sync] Skipping sync - local user');
    }
    return;
  }

  const userId = await getUserId();

  const drinks = await database.collections.get<Drink>('drinks').query().fetch();
  const userDrinks = drinks.filter((d) => d.userId === userId);
  const data = userDrinks.map(drinkToData);

  const uploadOperation = uploadData({
    path: `private/${userId}/${BACKUP_FILE}`,
    data: JSON.stringify(data),
    options: {
      contentType: 'application/json',
    },
  });

  await uploadOperation.result;

  // Mark all synced drinks
  await database.write(async () => {
    for (const drink of userDrinks) {
      await drink.update((d) => {
        d.synced = true;
      });
    }
  });
};

/**
 * Sync drinks from cloud storage to local database
 */
export const syncFromCloud = async (): Promise<void> => {
  // Skip sync for local users
  if (await isLocalUser()) {
    if (__DEV__) {
      console.log('[Sync] Skipping sync - local user');
    }
    return;
  }

  const userId = await getUserId();

  try {
    const downloadOperation = downloadData({
      path: `private/${userId}/${BACKUP_FILE}`,
    });

    const { body } = await downloadOperation.result;
    const text = await body.text();
    const cloudDrinks: DrinkData[] = JSON.parse(text);

    const localDrinks = await database.collections.get<Drink>('drinks').query().fetch();
    const localDrinkIds = new Set(localDrinks.map((d) => d.id));

    await database.write(async () => {
      for (const cloudDrink of cloudDrinks) {
        if (!localDrinkIds.has(cloudDrink.id)) {
          await database.collections.get<Drink>('drinks').create((drink) => {
            drink._raw.id = cloudDrink.id;
            drink.flavor = cloudDrink.flavor;
            drink.price = cloudDrink.price;
            drink.store = cloudDrink.store;
            drink.occasion = cloudDrink.occasion;
            drink.rating = cloudDrink.rating;
            drink.date = cloudDrink.date;
            drink.s3Key = cloudDrink.s3Key;
            drink.userId = userId;
            drink.synced = true;
            drink.lastModified = new Date(cloudDrink.lastModified);
          });
        }
      }
    });
  } catch (error) {
    // No backup found is expected for first-time users
    if (__DEV__) {
      console.log('No backup found or error syncing:', error);
    }
  }
};
