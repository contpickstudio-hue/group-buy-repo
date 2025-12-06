import { vi } from 'vitest';

// Mock Supabase client
export const supabaseClient = {
  auth: {
    signUp: vi.fn().mockResolvedValue({ 
      data: { user: { id: '1', email: 'test@example.com' } }, 
      error: null 
    }),
    signInWithPassword: vi.fn().mockResolvedValue({ 
      data: { user: { id: '1', email: 'test@example.com' } }, 
      error: null 
    }),
    signInWithOAuth: vi.fn().mockResolvedValue({ 
      data: null, 
      error: null 
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    getUser: vi.fn().mockResolvedValue({ 
      data: { user: { id: '1', email: 'test@example.com' } }, 
      error: null 
    }),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn().mockResolvedValue({ data: [], error: null }),
  })),
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  })),
  removeChannel: vi.fn(),
};

// Mock storage keys
export const StorageKeys = {
  user: 'userProfile',
  helperData: 'helperData',
  loginMethod: 'loginMethod',
  products: 'products',
  orders: 'orders',
  errands: 'errands',
  applications: 'applications',
  messages: 'messages'
};

// Mock database operations
export const dbSaveSlice = vi.fn().mockResolvedValue({ success: true });
export const dbLoadSlice = vi.fn().mockResolvedValue(null);
export const dbClearAll = vi.fn().mockResolvedValue({ success: true });

// Mock authentication functions
export const signUpWithEmail = vi.fn().mockResolvedValue({
  success: true,
  data: { user: { id: '1', email: 'test@example.com' } },
  error: null
});

export const signInWithEmail = vi.fn().mockResolvedValue({
  success: true,
  data: { user: { id: '1', email: 'test@example.com' } },
  error: null
});

export const signInWithGoogle = vi.fn().mockResolvedValue({
  success: true,
  data: null,
  error: null
});

export const signOut = vi.fn().mockResolvedValue({
  success: true,
  error: null
});

export const getCurrentUser = vi.fn().mockResolvedValue({
  user: { id: '1', email: 'test@example.com' },
  error: null
});

// Mock data loading functions
export const loadProductsFromBackend = vi.fn().mockResolvedValue([]);
export const loadOrdersFromBackend = vi.fn().mockResolvedValue([]);
export const loadErrandsFromBackend = vi.fn().mockResolvedValue({
  errands: [],
  applications: [],
  messages: []
});

// Helper to reset all mocks
export const resetSupabaseMocks = () => {
  vi.clearAllMocks();
  
  // Reset to default successful responses
  signUpWithEmail.mockResolvedValue({
    success: true,
    data: { user: { id: '1', email: 'test@example.com' } },
    error: null
  });
  
  signInWithEmail.mockResolvedValue({
    success: true,
    data: { user: { id: '1', email: 'test@example.com' } },
    error: null
  });
  
  loadProductsFromBackend.mockResolvedValue([]);
  loadOrdersFromBackend.mockResolvedValue([]);
  loadErrandsFromBackend.mockResolvedValue({
    errands: [],
    applications: [],
    messages: []
  });
};

// Helper to simulate errors
export const simulateSupabaseError = (functionName, errorMessage) => {
  const mockFunctions = {
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    getCurrentUser,
    loadProductsFromBackend,
    loadOrdersFromBackend,
    loadErrandsFromBackend,
    dbSaveSlice,
    dbLoadSlice,
  };
  
  if (mockFunctions[functionName]) {
    mockFunctions[functionName].mockRejectedValue(new Error(errorMessage));
  }
};
