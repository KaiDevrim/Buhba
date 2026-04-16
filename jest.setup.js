// Jest setup file for React Native testing

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => inset,
  };
});

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  AntDesign: 'AntDesign',
}));

jest.mock('@expo/vector-icons/AntDesign', () => 'AntDesign');

// Mock aws-amplify
jest.mock('aws-amplify', () => ({
  Amplify: {
    configure: jest.fn(),
  },
}));

jest.mock('aws-amplify/auth', () => ({
  signInWithRedirect: jest.fn(),
  fetchAuthSession: jest.fn(() => Promise.resolve({ identityId: 'test-identity-id' })),
  getCurrentUser: jest.fn(() =>
    Promise.resolve({
      userId: 'test-user-id',
      signInDetails: { loginId: 'test@example.com' },
    })
  ),
}));

jest.mock('aws-amplify/storage', () => ({
  uploadData: jest.fn(() => ({ result: Promise.resolve({}) })),
  downloadData: jest.fn(() => ({
    result: Promise.resolve({
      body: { text: () => Promise.resolve('[]') },
    }),
  })),
  getUrl: jest.fn(() => Promise.resolve({ url: new URL('https://example.com/image.jpg') })),
  remove: jest.fn(() => Promise.resolve()),
}));

jest.mock('aws-amplify/utils', () => ({
  Hub: {
    listen: jest.fn(() => () => {}),
  },
}));

jest.mock('@aws-amplify/ui-react-native', () => ({
  useAuthenticator: jest.fn(() => ({ authStatus: 'authenticated' })),
  Authenticator: {
    Provider: ({ children }) => children,
  },
}));

// Mock WatermelonDB
jest.mock('@nozbe/watermelondb', () => ({
  Database: jest.fn(),
  Model: class Model {
    static table = '';
  },
  Q: {
    where: jest.fn(),
  },
}));

jest.mock('@nozbe/watermelondb/DatabaseProvider', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }) => children,
    DatabaseContext: React.createContext(null),
    DatabaseConsumer: ({ children }) => children(null),
    withDatabase: (Component) => Component,
  };
});

jest.mock('@nozbe/watermelondb/decorators', () => ({
  field: () => () => {},
  text: () => () => {},
  date: () => () => {},
}));

// Mock database
jest.mock('./database/index.native', () => ({
  __esModule: true,
  default: {
    collections: {
      get: jest.fn(() => ({
        query: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve([])),
        })),
        find: jest.fn(() => Promise.resolve(null)),
        create: jest.fn(),
      })),
    },
    write: jest.fn((fn) => fn()),
  },
}));

// Mock react-navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
    useRoute: () => ({
      params: { drinkId: 'test-drink-id' },
    }),
    useFocusEffect: jest.fn((cb) => cb()),
  };
});

// Mock Amplify config
jest.mock('./src/config/amplify', () => ({
  configureAmplify: jest.fn(),
  amplifyConfig: {},
}));

// Suppress expected console output in tests for cleaner output
const originalWarn = console.warn;
const originalError = console.error;
const originalLog = console.log;

// Messages that are expected during tests (error handling scenarios)
const suppressedMessages = [
  'Please update the following components',
  'componentWillReceiveProps',
  'Location permission not granted',
  'Google Places API key not configured',
  'Failed to get image URL',
  'Error getting location',
  'Error searching places',
  'Places API error',
  'Place details error',
  'Nearby search error',
  'No backup found',
];

const shouldSuppress = (args) => {
  const message = args[0]?.toString?.() || '';
  return suppressedMessages.some((suppressed) => message.includes(suppressed));
};

console.warn = (...args) => {
  if (shouldSuppress(args)) return;
  originalWarn.apply(console, args);
};

console.error = (...args) => {
  if (shouldSuppress(args)) return;
  originalError.apply(console, args);
};

console.log = (...args) => {
  if (shouldSuppress(args)) return;
  originalLog.apply(console, args);
};
