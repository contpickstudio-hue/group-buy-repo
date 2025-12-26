import React from 'react';
import { render } from '@testing-library/react';
import TranslationProvider from '../contexts/TranslationProvider';
import { vi } from 'vitest';
import { Toaster } from 'react-hot-toast';
import GlobalErrorBoundary from '../components/ErrorBoundary';

// Mock Zustand store
export const createMockStore = (initialState = {}) => {
  const defaultState = {
    // User state
    user: null,
    loginMethod: null,
    selectedRoles: new Set(),
    helperData: {
      name: '',
      phone: '',
      street: '',
      city: '',
      province: '',
      postal: '',
      idPhotoDataUrl: '',
      generatedCode: '',
      enteredCode: '',
      smsVerified: false,
      idVerified: false
    },
    helperStepIndex: 0,
    authLoading: false,
    authError: null,

    // Data state
    products: [],
    orders: [],
    errands: [],
    applications: [],
    messages: [],
    productsLoading: false,
    ordersLoading: false,
    errandsLoading: false,
    productsError: null,
    ordersError: null,
    errandsError: null,

    // UI state
    currentScreen: 'start',
    loading: false,
    error: null,
    notifications: [],
    modals: {
      productDetails: { open: false, productId: null },
      errandDetails: { open: false, errandId: null },
      userProfile: { open: false },
      helperVerification: { open: false }
    },
    mobileMenuOpen: false,
    fabMenuOpen: false,

    // Filter state
    filters: {
      groupbuys: {
        search: '',
        region: 'all',
        vendor: 'all',
        sort: 'popularity',
        category: 'all',
        priceRange: 'all',
        status: 'all'
      },
      errands: {
        search: '',
        region: 'all',
        category: 'all',
        budgetMin: '',
        budgetMax: '',
        sort: 'deadline'
      },
      vendorOrders: {
        status: 'all',
        search: '',
        dateRange: 'all',
        sort: 'newest'
      }
    },

    // Actions (mocked)
    setUser: vi.fn(),
    updateUser: vi.fn(),
    clearUser: vi.fn(),
    setCurrentScreen: vi.fn(),
    setLoading: vi.fn(),
    setError: vi.fn(),
    clearError: vi.fn(),
    addNotification: vi.fn(),
    removeNotification: vi.fn(),
    setProducts: vi.fn(),
    addProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
    loadProducts: vi.fn().mockResolvedValue({ success: true, data: [] }),
    loadOrders: vi.fn().mockResolvedValue({ success: true, data: [] }),
    loadErrands: vi.fn().mockResolvedValue({ success: true, data: { errands: [], applications: [], messages: [] } }),
    signUp: vi.fn().mockResolvedValue({ success: true }),
    signIn: vi.fn().mockResolvedValue({ success: true }),
    signOut: vi.fn().mockResolvedValue({ success: true }),
    createProduct: vi.fn().mockResolvedValue({ success: true }),
    joinGroupBuy: vi.fn().mockResolvedValue({ success: true }),
    createErrand: vi.fn().mockResolvedValue({ success: true }),
    applyToErrand: vi.fn().mockResolvedValue({ success: true }),
    updateGroupBuyFilters: vi.fn(),
    updateErrandFilters: vi.fn(),
    resetFilters: vi.fn(),
    ...initialState
  };

  return defaultState;
};

// Mock the store hooks
export const mockStoreHooks = (storeState) => {
  vi.doMock('../stores', () => ({
    useAppStore: () => storeState,
    useUser: () => storeState.user,
    useUserActions: () => ({
      setUser: storeState.setUser,
      updateUser: storeState.updateUser,
      clearUser: storeState.clearUser,
      signUp: storeState.signUp,
      signIn: storeState.signIn,
      signOut: storeState.signOut,
      checkAuthStatus: storeState.checkAuthStatus || vi.fn(),
      setDemoUser: storeState.setDemoUser || vi.fn(),
    }),
    useProducts: () => storeState.products,
    useProductActions: () => ({
      setProducts: storeState.setProducts,
      addProduct: storeState.addProduct,
      updateProduct: storeState.updateProduct,
      deleteProduct: storeState.deleteProduct,
      loadProducts: storeState.loadProducts,
      createProduct: storeState.createProduct,
      joinGroupBuy: storeState.joinGroupBuy,
    }),
    useOrders: () => storeState.orders,
    useOrderActions: () => ({
      loadOrders: storeState.loadOrders,
      addOrder: storeState.addOrder || vi.fn(),
      updateOrder: storeState.updateOrder || vi.fn(),
    }),
    useErrands: () => ({
      errands: storeState.errands,
      applications: storeState.applications,
      messages: storeState.messages,
    }),
    useErrandActions: () => ({
      loadErrands: storeState.loadErrands,
      createErrand: storeState.createErrand,
      applyToErrand: storeState.applyToErrand,
    }),
    useUI: () => ({
      currentScreen: storeState.currentScreen,
      loading: storeState.loading,
      error: storeState.error,
      notifications: storeState.notifications,
    }),
    useUIActions: () => ({
      setCurrentScreen: storeState.setCurrentScreen,
      setLoading: storeState.setLoading,
      setError: storeState.setError,
      clearError: storeState.clearError,
      addNotification: storeState.addNotification,
      removeNotification: storeState.removeNotification,
    }),
    useFilters: () => storeState.filters,
    useFilterActions: () => ({
      updateGroupBuyFilters: storeState.updateGroupBuyFilters,
      updateErrandFilters: storeState.updateErrandFilters,
      resetFilters: storeState.resetFilters,
    }),
    useFilteredProducts: () => storeState.products,
    useFilteredErrands: () => storeState.errands,
  }));
};

// Custom render function with providers (includes TranslationProvider)
export const renderWithProviders = (ui, options = {}) => {
  const {
    initialState = {},
    ...renderOptions
  } = options;

  const mockStore = createMockStore(initialState);
  mockStoreHooks(mockStore);

  const Wrapper = ({ children }) => (
    <GlobalErrorBoundary>
      <TranslationProvider>
        {children}
        <Toaster />
      </TranslationProvider>
    </GlobalErrorBoundary>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    mockStore,
  };
};

// Mock Supabase client
export const createMockSupabaseClient = () => ({
  auth: {
    signUp: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithOAuth: vi.fn().mockResolvedValue({ data: null, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  gt: vi.fn().mockReturnThis(),
  lt: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  like: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  then: vi.fn().mockResolvedValue({ data: [], error: null }),
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  }),
  removeChannel: vi.fn(),
});

// Mock error service
export const mockErrorService = {
  ErrorLogger: {
    log: vi.fn(),
    getStoredErrors: vi.fn().mockReturnValue([]),
    clearStoredErrors: vi.fn(),
  },
  showErrorToast: vi.fn(),
  showSuccessToast: vi.fn(),
  showWarningToast: vi.fn(),
  showInfoToast: vi.fn(),
  withErrorHandling: vi.fn().mockImplementation(async (operation) => {
    try {
      const result = await operation();
      return { success: true, data: result, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  }),
  apiCall: vi.fn().mockImplementation(async (operation) => {
    try {
      const result = await operation();
      return { success: true, data: result, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  }),
};

// Test data factories
export const createMockUser = (overrides = {}) => ({
  email: 'test@example.com',
  name: 'Test User',
  roles: ['customer'],
  helperVerified: false,
  ...overrides,
});

export const createMockProduct = (overrides = {}) => ({
  id: 1,
  title: 'Test Product',
  region: 'Toronto',
  price: 25.99,
  description: 'A test product for testing',
  deadline: '2025-12-31',
  deliveryDate: '2026-01-05',
  vendor: 'Test Vendor',
  targetQuantity: 10,
  currentQuantity: 5,
  imageColor: '#ff6b6b',
  ownerEmail: 'vendor@example.com',
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createMockErrand = (overrides = {}) => ({
  id: 1,
  title: 'Test Errand',
  description: 'A test errand for testing',
  region: 'Toronto',
  budget: 30,
  deadline: '2025-12-31T10:00:00',
  status: 'open',
  requesterEmail: 'customer@example.com',
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createMockOrder = (overrides = {}) => ({
  id: 1,
  productId: 1,
  customerEmail: 'customer@example.com',
  customerName: 'Test Customer',
  quantity: 2,
  totalPrice: 51.98,
  total: 51.98,
  groupStatus: 'open',
  fulfillmentStatus: 'pending',
  createdAt: new Date().toISOString(),
  ...overrides,
});

// Utility functions for testing
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

export const mockConsoleError = () => {
  const originalError = console.error;
  console.error = vi.fn();
  return () => {
    console.error = originalError;
  };
};

export const mockConsoleWarn = () => {
  const originalWarn = console.warn;
  console.warn = vi.fn();
  return () => {
    console.warn = originalWarn;
  };
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
