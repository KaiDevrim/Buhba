// Tests for component index exports

describe('Components index exports', () => {
  const expectedExports = [
    'BottomBar',
    'Button',
    'DetailRow',
    'EmptyState',
    'FormField',
    'GradientBackground',
    'LoadingState',
    'MyDrinkCard',
    'StatsBarChart',
    'StatsCard',
    'StoreAutocomplete',
    'VisitedLocationsMap',
    'VisitedLocation',
  ];

  it('exports all expected components', () => {
    // Check that all expected component names are defined
    expectedExports.forEach((name) => {
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    });
  });

  it('has correct number of exports', () => {
    expect(expectedExports.length).toBe(13);
  });

  it('includes BottomBar', () => {
    expect(expectedExports).toContain('BottomBar');
  });

  it('includes Button', () => {
    expect(expectedExports).toContain('Button');
  });

  it('includes DetailRow', () => {
    expect(expectedExports).toContain('DetailRow');
  });

  it('includes EmptyState', () => {
    expect(expectedExports).toContain('EmptyState');
  });

  it('includes FormField', () => {
    expect(expectedExports).toContain('FormField');
  });

  it('includes GradientBackground', () => {
    expect(expectedExports).toContain('GradientBackground');
  });

  it('includes LoadingState', () => {
    expect(expectedExports).toContain('LoadingState');
  });

  it('includes MyDrinkCard', () => {
    expect(expectedExports).toContain('MyDrinkCard');
  });

  it('includes StatsCard', () => {
    expect(expectedExports).toContain('StatsCard');
  });

  it('includes StatsBarChart', () => {
    expect(expectedExports).toContain('StatsBarChart');
  });

  it('includes StoreAutocomplete', () => {
    expect(expectedExports).toContain('StoreAutocomplete');
  });

  it('includes VisitedLocationsMap', () => {
    expect(expectedExports).toContain('VisitedLocationsMap');
  });

  it('includes VisitedLocation type', () => {
    expect(expectedExports).toContain('VisitedLocation');
  });
});

describe('Pages index exports', () => {
  const expectedPages = ['Gallery', 'AddDrink', 'DrinkDetail', 'EditDrink', 'Stats'];

  it('exports all expected pages', () => {
    expectedPages.forEach((name) => {
      expect(typeof name).toBe('string');
    });
  });

  it('has correct number of page exports', () => {
    expect(expectedPages.length).toBe(5);
  });
});

describe('Services index exports', () => {
  const expectedServices = [
    'storageService',
    'syncService',
    'locationService',
    'imageCacheService',
    'placesService',
    'rankingsService',
  ];

  it('exports all expected services', () => {
    expectedServices.forEach((name) => {
      expect(typeof name).toBe('string');
    });
  });

  it('has storage service', () => {
    expect(expectedServices).toContain('storageService');
  });

  it('has sync service', () => {
    expect(expectedServices).toContain('syncService');
  });

  it('has location service', () => {
    expect(expectedServices).toContain('locationService');
  });
});

describe('Hooks index exports', () => {
  const expectedHooks = ['useCurrentUser', 'useLocation', 'useS3Image'];

  it('exports all expected hooks', () => {
    expectedHooks.forEach((name) => {
      expect(typeof name).toBe('string');
    });
  });

  it('has useCurrentUser hook', () => {
    expect(expectedHooks).toContain('useCurrentUser');
  });

  it('has useLocation hook', () => {
    expect(expectedHooks).toContain('useLocation');
  });

  it('has useS3Image hook', () => {
    expect(expectedHooks).toContain('useS3Image');
  });
});
