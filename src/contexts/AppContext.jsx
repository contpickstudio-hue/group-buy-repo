import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { 
    loadProductsFromBackend, 
    loadOrdersFromBackend, 
    loadErrandsFromBackend,
    getCurrentUser,
    supabaseClient 
} from '../services/supabaseService';

// Initial state
const initialState = {
    user: null,
    loginMethod: null,
    currentScreen: 'start',
    selectedRoles: new Set(),
    helperStepIndex: 0,
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
    products: [],
    orders: [],
    errands: [],
    applications: [],
    messages: [],
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
            budgetMax: ''
        },
        vendorOrders: {
            status: 'all',
            search: ''
        }
    },
    loading: false,
    error: null
};

// Action types
const ActionTypes = {
    SET_LOADING: 'SET_LOADING',
    SET_ERROR: 'SET_ERROR',
    SET_USER: 'SET_USER',
    SET_CURRENT_SCREEN: 'SET_CURRENT_SCREEN',
    SET_SELECTED_ROLES: 'SET_SELECTED_ROLES',
    SET_HELPER_DATA: 'SET_HELPER_DATA',
    SET_HELPER_STEP: 'SET_HELPER_STEP',
    SET_PRODUCTS: 'SET_PRODUCTS',
    SET_ORDERS: 'SET_ORDERS',
    SET_ERRANDS: 'SET_ERRANDS',
    SET_APPLICATIONS: 'SET_APPLICATIONS',
    SET_MESSAGES: 'SET_MESSAGES',
    UPDATE_FILTERS: 'UPDATE_FILTERS',
    ADD_PRODUCT: 'ADD_PRODUCT',
    UPDATE_PRODUCT: 'UPDATE_PRODUCT',
    DELETE_PRODUCT: 'DELETE_PRODUCT',
    ADD_ORDER: 'ADD_ORDER',
    UPDATE_ORDER: 'UPDATE_ORDER',
    ADD_ERRAND: 'ADD_ERRAND',
    UPDATE_ERRAND: 'UPDATE_ERRAND',
    ADD_APPLICATION: 'ADD_APPLICATION',
    UPDATE_APPLICATION: 'UPDATE_APPLICATION',
    RESET_STATE: 'RESET_STATE'
};

// Reducer function
function appReducer(state, action) {
    switch (action.type) {
        case ActionTypes.SET_LOADING:
            return { ...state, loading: action.payload };
            
        case ActionTypes.SET_ERROR:
            return { ...state, error: action.payload };
            
        case ActionTypes.SET_USER:
            return { ...state, user: action.payload };
            
        case ActionTypes.SET_CURRENT_SCREEN:
            return { ...state, currentScreen: action.payload };
            
        case ActionTypes.SET_SELECTED_ROLES:
            return { ...state, selectedRoles: new Set(action.payload) };
            
        case ActionTypes.SET_HELPER_DATA:
            return { ...state, helperData: { ...state.helperData, ...action.payload } };
            
        case ActionTypes.SET_HELPER_STEP:
            return { ...state, helperStepIndex: action.payload };
            
        case ActionTypes.SET_PRODUCTS:
            return { ...state, products: action.payload };
            
        case ActionTypes.SET_ORDERS:
            return { ...state, orders: action.payload };
            
        case ActionTypes.SET_ERRANDS:
            return { ...state, errands: action.payload };
            
        case ActionTypes.SET_APPLICATIONS:
            return { ...state, applications: action.payload };
            
        case ActionTypes.SET_MESSAGES:
            return { ...state, messages: action.payload };
            
        case ActionTypes.UPDATE_FILTERS:
            return {
                ...state,
                filters: {
                    ...state.filters,
                    [action.payload.type]: {
                        ...state.filters[action.payload.type],
                        ...action.payload.filters
                    }
                }
            };
            
        case ActionTypes.ADD_PRODUCT:
            return { ...state, products: [...state.products, action.payload] };
            
        case ActionTypes.UPDATE_PRODUCT:
            return {
                ...state,
                products: state.products.map(p => 
                    p.id === action.payload.id ? { ...p, ...action.payload } : p
                )
            };
            
        case ActionTypes.DELETE_PRODUCT:
            return {
                ...state,
                products: state.products.filter(p => p.id !== action.payload)
            };
            
        case ActionTypes.ADD_ORDER:
            return { ...state, orders: [...state.orders, action.payload] };
            
        case ActionTypes.UPDATE_ORDER:
            return {
                ...state,
                orders: state.orders.map(o => 
                    o.id === action.payload.id ? { ...o, ...action.payload } : o
                )
            };
            
        case ActionTypes.ADD_ERRAND:
            return { ...state, errands: [...state.errands, action.payload] };
            
        case ActionTypes.UPDATE_ERRAND:
            return {
                ...state,
                errands: state.errands.map(e => 
                    e.id === action.payload.id ? { ...e, ...action.payload } : e
                )
            };
            
        case ActionTypes.ADD_APPLICATION:
            return { ...state, applications: [...state.applications, action.payload] };
            
        case ActionTypes.UPDATE_APPLICATION:
            return {
                ...state,
                applications: state.applications.map(a => 
                    a.id === action.payload.id ? { ...a, ...action.payload } : a
                )
            };
            
        case ActionTypes.RESET_STATE:
            return { ...initialState, currentScreen: 'start' };
            
        default:
            return state;
    }
}

// Create context
const AppContext = createContext();

// Context provider component
export function AppProvider({ children }) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // Initialize app data
    useEffect(() => {
        async function initializeApp() {
            dispatch({ type: ActionTypes.SET_LOADING, payload: true });
            
            try {
                // Check for existing user session
                const { user } = await getCurrentUser();
                if (user) {
                    dispatch({ type: ActionTypes.SET_USER, payload: {
                        email: user.email,
                        name: user.user_metadata?.name || user.email.split('@')[0],
                        roles: user.user_metadata?.roles || ['customer'],
                        helperVerified: user.user_metadata?.helperVerified || false
                    }});
                }
                
                // Load data
                const products = await loadProductsFromBackend();
                const orders = await loadOrdersFromBackend();
                const { errands, applications, messages } = await loadErrandsFromBackend();
                
                dispatch({ type: ActionTypes.SET_PRODUCTS, payload: products });
                dispatch({ type: ActionTypes.SET_ORDERS, payload: orders });
                dispatch({ type: ActionTypes.SET_ERRANDS, payload: errands });
                dispatch({ type: ActionTypes.SET_APPLICATIONS, payload: applications });
                dispatch({ type: ActionTypes.SET_MESSAGES, payload: messages });
                
                // Set initial screen based on user state
                if (user) {
                    dispatch({ type: ActionTypes.SET_CURRENT_SCREEN, payload: 'browse' });
                } else {
                    dispatch({ type: ActionTypes.SET_CURRENT_SCREEN, payload: 'start' });
                }
                
            } catch (error) {
                console.error('Failed to initialize app:', error);
                dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
            } finally {
                dispatch({ type: ActionTypes.SET_LOADING, payload: false });
            }
        }

        initializeApp();
        
        // Set up real-time subscriptions
        if (supabaseClient) {
            const subscriptions = [];
            
            // Subscribe to products changes
            const productsSubscription = supabaseClient
                .channel('products_changes')
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'products' },
                    async () => {
                        const products = await loadProductsFromBackend();
                        dispatch({ type: ActionTypes.SET_PRODUCTS, payload: products });
                    }
                )
                .subscribe();
            subscriptions.push(productsSubscription);
            
            // Subscribe to orders changes
            const ordersSubscription = supabaseClient
                .channel('orders_changes')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'orders' },
                    async () => {
                        const orders = await loadOrdersFromBackend();
                        dispatch({ type: ActionTypes.SET_ORDERS, payload: orders });
                    }
                )
                .subscribe();
            subscriptions.push(ordersSubscription);
            
            // Subscribe to errands changes
            const errandsSubscription = supabaseClient
                .channel('errands_changes')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'errands' },
                    async () => {
                        const { errands } = await loadErrandsFromBackend();
                        dispatch({ type: ActionTypes.SET_ERRANDS, payload: errands });
                    }
                )
                .subscribe();
            subscriptions.push(errandsSubscription);
            
            // Cleanup subscriptions on unmount
            return () => {
                subscriptions.forEach(sub => {
                    supabaseClient.removeChannel(sub);
                });
            };
        }
    }, []);

    // Action creators
    const actions = {
        setLoading: (loading) => dispatch({ type: ActionTypes.SET_LOADING, payload: loading }),
        setError: (error) => dispatch({ type: ActionTypes.SET_ERROR, payload: error }),
        setUser: (user) => dispatch({ type: ActionTypes.SET_USER, payload: user }),
        setCurrentScreen: (screen) => dispatch({ type: ActionTypes.SET_CURRENT_SCREEN, payload: screen }),
        setSelectedRoles: (roles) => dispatch({ type: ActionTypes.SET_SELECTED_ROLES, payload: roles }),
        setHelperData: (data) => dispatch({ type: ActionTypes.SET_HELPER_DATA, payload: data }),
        setHelperStep: (step) => dispatch({ type: ActionTypes.SET_HELPER_STEP, payload: step }),
        updateFilters: (type, filters) => dispatch({ type: ActionTypes.UPDATE_FILTERS, payload: { type, filters } }),
        addProduct: (product) => dispatch({ type: ActionTypes.ADD_PRODUCT, payload: product }),
        updateProduct: (product) => dispatch({ type: ActionTypes.UPDATE_PRODUCT, payload: product }),
        deleteProduct: (productId) => dispatch({ type: ActionTypes.DELETE_PRODUCT, payload: productId }),
        addOrder: (order) => dispatch({ type: ActionTypes.ADD_ORDER, payload: order }),
        updateOrder: (order) => dispatch({ type: ActionTypes.UPDATE_ORDER, payload: order }),
        addErrand: (errand) => dispatch({ type: ActionTypes.ADD_ERRAND, payload: errand }),
        updateErrand: (errand) => dispatch({ type: ActionTypes.UPDATE_ERRAND, payload: errand }),
        addApplication: (application) => dispatch({ type: ActionTypes.ADD_APPLICATION, payload: application }),
        updateApplication: (application) => dispatch({ type: ActionTypes.UPDATE_APPLICATION, payload: application }),
        resetState: () => dispatch({ type: ActionTypes.RESET_STATE })
    };

    return (
        <AppContext.Provider value={{ state, actions }}>
            {children}
        </AppContext.Provider>
    );
}

// Custom hook to use the app context
export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}

export { ActionTypes };
