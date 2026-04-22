import type {
  RootStackParamList,
  TabParamList,
  UserInfo,
  DrinkForm,
  DrinkData,
  StatsData,
} from '@/types';

describe('Type exports', () => {
  describe('Navigation types', () => {
    it('RootStackParamList has correct shape', () => {
      const routes: RootStackParamList = {
        MainTabs: undefined,
        DrinkDetail: { drinkId: '123' },
        EditDrink: { drinkId: '123' },
        Profile: undefined,
        Login: undefined,
        Explore: undefined,
      };
      expect(routes).toBeDefined();
      expect(routes.MainTabs).toBeUndefined();
      expect(routes.DrinkDetail.drinkId).toBe('123');
      expect(routes.EditDrink.drinkId).toBe('123');
      expect(routes.Profile).toBeUndefined();
    });

    it('TabParamList has correct shape', () => {
      const tabs: TabParamList = {
        Gallery: undefined,
        AddDrink: undefined,
        Stats: undefined,
        Explore: undefined,
      };

      expect(tabs.Gallery).toBeUndefined();
      expect(tabs.AddDrink).toBeUndefined();
      expect(tabs.Stats).toBeUndefined();
    });
  });

  describe('UserInfo type', () => {
    it('has required fields', () => {
      const user: UserInfo = {
        userId: 'user-123',
        identityId: 'identity-123',
      };

      expect(user.userId).toBe('user-123');
      expect(user.identityId).toBe('identity-123');
    });

    it('has optional email field', () => {
      const userWithEmail: UserInfo = {
        userId: 'user-123',
        identityId: 'identity-123',
        email: 'test@example.com',
      };

      expect(userWithEmail.email).toBe('test@example.com');
    });
  });

  describe('DrinkForm type', () => {
    it('has correct shape for form state', () => {
      const form: DrinkForm = {
        flavor: 'Matcha',
        price: '5.99',
        store: 'Tsaocaa',
        occasion: 'Celebration',
        rating: 4,
        imageUri: 'file://image.jpg',
        latitude: 37.7749,
        longitude: -122.4194,
        placeId: 'ChIJ123456',
      };

      expect(form.flavor).toBe('Matcha');
      expect(form.price).toBe('5.99'); // Price is string in form
      expect(form.rating).toBe(4);
      expect(form.latitude).toBe(37.7749);
      expect(form.longitude).toBe(-122.4194);
      expect(form.placeId).toBe('ChIJ123456');
    });

    it('allows null values for optional fields', () => {
      const emptyForm: DrinkForm = {
        flavor: '',
        price: '',
        store: '',
        occasion: '',
        rating: null,
        imageUri: null,
        latitude: null,
        longitude: null,
        placeId: null,
      };

      expect(emptyForm.rating).toBeNull();
      expect(emptyForm.imageUri).toBeNull();
      expect(emptyForm.latitude).toBeNull();
      expect(emptyForm.longitude).toBeNull();
      expect(emptyForm.placeId).toBeNull();
    });
  });

  describe('DrinkData type', () => {
    it('has correct shape for database data', () => {
      const drink: DrinkData = {
        id: 'drink-1',
        flavor: 'Taro',
        price: 6.99, // Price is number in data
        store: 'Gong Cha',
        occasion: 'Birthday',
        rating: 5,
        date: '2024-12-29',
        s3Key: 'drinks/taro.jpg',
        userId: 'user-123',
        lastModified: Date.now(),
      };

      expect(drink.id).toBe('drink-1');
      expect(drink.price).toBe(6.99);
      expect(typeof drink.lastModified).toBe('number');
    });

    it('allows null s3Key', () => {
      const drink: DrinkData = {
        id: 'drink-2',
        flavor: 'Classic',
        price: 4.99,
        store: 'Tiger Sugar',
        occasion: 'Work break',
        rating: 3,
        date: '2024-12-29',
        s3Key: null,
        userId: 'user-123',
        lastModified: Date.now(),
      };

      expect(drink.s3Key).toBeNull();
    });
  });

  describe('StatsData type', () => {
    it('has correct shape for statistics', () => {
      const stats: StatsData = {
        drinkCount: 10,
        storeCount: 5,
        totalSpent: 59.9,
        topStores: [
          ['Tsaocaa', 4],
          ['Gong Cha', 3],
          ['Tiger Sugar', 3],
        ],
      };

      expect(stats.drinkCount).toBe(10);
      expect(stats.storeCount).toBe(5);
      expect(stats.totalSpent).toBe(59.9);
      expect(stats.topStores).toHaveLength(3);
      expect(stats.topStores[0]).toEqual(['Tsaocaa', 4]);
    });

    it('allows empty topStores array', () => {
      const emptyStats: StatsData = {
        drinkCount: 0,
        storeCount: 0,
        totalSpent: 0,
        topStores: [],
      };

      expect(emptyStats.topStores).toHaveLength(0);
    });
  });
});
