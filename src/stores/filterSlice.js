export const createFilterSlice = (set, get) => ({
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
    
    // Filter presets
    filterPresets: {
        groupbuys: {
            'hot-deals': {
                name: 'Hot Deals',
                filters: { status: 'closing-soon', sort: 'deadline' }
            },
            'new-arrivals': {
                name: 'New Arrivals',
                filters: { status: 'new', sort: 'newest' }
            },
            'almost-full': {
                name: 'Almost Full',
                filters: { status: 'almost-full', sort: 'progress' }
            },
            'budget-friendly': {
                name: 'Budget Friendly',
                filters: { priceRange: 'under-25', sort: 'price-low' }
            }
        },
        errands: {
            'urgent': {
                name: 'Urgent',
                filters: { sort: 'deadline' }
            },
            'high-paying': {
                name: 'High Paying',
                filters: { budgetMin: '50', sort: 'budget-high' }
            },
            'quick-tasks': {
                name: 'Quick Tasks',
                filters: { budgetMax: '25', sort: 'budget-low' }
            }
        }
    },
    
    // Actions
    updateGroupBuyFilters: (updates) => {
        set((state) => {
            Object.assign(state.filters.groupbuys, updates);
        });
    },
    
    updateErrandFilters: (updates) => {
        set((state) => {
            Object.assign(state.filters.errands, updates);
        });
    },
    
    updateVendorOrderFilters: (updates) => {
        set((state) => {
            Object.assign(state.filters.vendorOrders, updates);
        });
    },
    
    resetFilters: (filterType = 'all') => {
        set((state) => {
            if (filterType === 'all' || filterType === 'groupbuys') {
                state.filters.groupbuys = {
                    search: '',
                    region: 'all',
                    vendor: 'all',
                    sort: 'popularity',
                    category: 'all',
                    priceRange: 'all',
                    status: 'all'
                };
            }
            
            if (filterType === 'all' || filterType === 'errands') {
                state.filters.errands = {
                    search: '',
                    region: 'all',
                    category: 'all',
                    budgetMin: '',
                    budgetMax: '',
                    sort: 'deadline'
                };
            }
            
            if (filterType === 'all' || filterType === 'vendorOrders') {
                state.filters.vendorOrders = {
                    status: 'all',
                    search: '',
                    dateRange: 'all',
                    sort: 'newest'
                };
            }
        });
    },
    
    // Preset management
    applyFilterPreset: (filterType, presetName) => {
        const { filterPresets } = get();
        const preset = filterPresets[filterType]?.[presetName];
        
        if (!preset) return false;
        
        set((state) => {
            Object.assign(state.filters[filterType], preset.filters);
        });
        
        return true;
    },
    
    saveFilterPreset: (filterType, presetName, presetData) => {
        set((state) => {
            if (!state.filterPresets[filterType]) {
                state.filterPresets[filterType] = {};
            }
            
            state.filterPresets[filterType][presetName] = {
                name: presetData.name || presetName,
                filters: { ...state.filters[filterType] },
                createdAt: new Date().toISOString()
            };
        });
    },
    
    deleteFilterPreset: (filterType, presetName) => {
        set((state) => {
            if (state.filterPresets[filterType]?.[presetName]) {
                delete state.filterPresets[filterType][presetName];
            }
        });
    },
    
    // Advanced filtering helpers
    getActiveFilterCount: (filterType) => {
        const { filters } = get();
        const filterObj = filters[filterType];
        
        if (!filterObj) return 0;
        
        let count = 0;
        
        Object.entries(filterObj).forEach(([key, value]) => {
            if (key === 'search' && value.trim()) count++;
            else if (key === 'budgetMin' && value) count++;
            else if (key === 'budgetMax' && value) count++;
            else if (typeof value === 'string' && value !== 'all' && value !== '') count++;
        });
        
        return count;
    },
    
    hasActiveFilters: (filterType) => {
        return get().getActiveFilterCount(filterType) > 0;
    },
    
    getFilterSummary: (filterType) => {
        const { filters } = get();
        const filterObj = filters[filterType];
        
        if (!filterObj) return '';
        
        const activeParts = [];
        
        if (filterObj.search?.trim()) {
            activeParts.push(`"${filterObj.search.trim()}"`);
        }
        
        if (filterObj.region && filterObj.region !== 'all') {
            activeParts.push(`in ${filterObj.region}`);
        }
        
        if (filterObj.category && filterObj.category !== 'all') {
            activeParts.push(`${filterObj.category} category`);
        }
        
        if (filterObj.priceRange && filterObj.priceRange !== 'all') {
            const priceRangeLabels = {
                'under-25': 'under $25',
                '25-50': '$25-$50',
                '50-100': '$50-$100',
                '100-200': '$100-$200',
                'over-200': 'over $200'
            };
            activeParts.push(priceRangeLabels[filterObj.priceRange] || filterObj.priceRange);
        }
        
        if (filterObj.budgetMin || filterObj.budgetMax) {
            const min = filterObj.budgetMin ? `$${filterObj.budgetMin}` : '';
            const max = filterObj.budgetMax ? `$${filterObj.budgetMax}` : '';
            if (min && max) {
                activeParts.push(`budget ${min}-${max}`);
            } else if (min) {
                activeParts.push(`budget ${min}+`);
            } else if (max) {
                activeParts.push(`budget up to ${max}`);
            }
        }
        
        if (filterObj.status && filterObj.status !== 'all') {
            const statusLabels = {
                'open': 'open',
                'closing-soon': 'closing soon',
                'almost-full': 'almost full',
                'new': 'new arrivals'
            };
            activeParts.push(statusLabels[filterObj.status] || filterObj.status);
        }
        
        return activeParts.join(', ');
    },
    
    // Quick filter actions
    quickFilterByRegion: (filterType, region) => {
        set((state) => {
            state.filters[filterType].region = region;
        });
    },
    
    quickFilterByCategory: (filterType, category) => {
        set((state) => {
            state.filters[filterType].category = category;
        });
    },
    
    quickFilterByPriceRange: (priceRange) => {
        set((state) => {
            state.filters.groupbuys.priceRange = priceRange;
        });
    },
    
    quickFilterByStatus: (status) => {
        set((state) => {
            state.filters.groupbuys.status = status;
        });
    },
    
    quickSearch: (filterType, query) => {
        set((state) => {
            state.filters[filterType].search = query;
        });
    },
    
    // Sort helpers
    updateSort: (filterType, sortOption) => {
        set((state) => {
            state.filters[filterType].sort = sortOption;
        });
    },
    
    getSortOptions: (filterType) => {
        const sortOptions = {
            groupbuys: [
                { value: 'popularity', label: '🔥 Popularity' },
                { value: 'deadline', label: '⏰ Deadline' },
                { value: 'price-low', label: '💰 Price: Low to High' },
                { value: 'price-high', label: '💰 Price: High to Low' },
                { value: 'progress', label: '📊 Progress' },
                { value: 'newest', label: '✨ Newest' }
            ],
            errands: [
                { value: 'deadline', label: '⏰ Deadline' },
                { value: 'budget-high', label: '💰 Budget: High to Low' },
                { value: 'budget-low', label: '💰 Budget: Low to High' },
                { value: 'newest', label: '✨ Newest' },
                { value: 'oldest', label: '📅 Oldest' }
            ],
            vendorOrders: [
                { value: 'newest', label: '✨ Newest' },
                { value: 'oldest', label: '📅 Oldest' },
                { value: 'amount-high', label: '💰 Amount: High to Low' },
                { value: 'amount-low', label: '💰 Amount: Low to High' },
                { value: 'status', label: '📋 Status' }
            ]
        };
        
        return sortOptions[filterType] || [];
    },
    
    // Filter validation
    validateFilters: (filterType) => {
        const { filters } = get();
        const filterObj = filters[filterType];
        const errors = [];
        
        if (filterObj.budgetMin && filterObj.budgetMax) {
            const min = parseFloat(filterObj.budgetMin);
            const max = parseFloat(filterObj.budgetMax);
            
            if (min > max) {
                errors.push('Minimum budget cannot be greater than maximum budget');
            }
        }
        
        if (filterObj.budgetMin && parseFloat(filterObj.budgetMin) < 0) {
            errors.push('Budget cannot be negative');
        }
        
        if (filterObj.budgetMax && parseFloat(filterObj.budgetMax) < 0) {
            errors.push('Budget cannot be negative');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    },
    
    // Filter analytics
    getFilterUsageStats: () => {
        const { filters } = get();
        const stats = {};
        
        Object.entries(filters).forEach(([filterType, filterObj]) => {
            stats[filterType] = {
                activeFilters: get().getActiveFilterCount(filterType),
                hasSearch: !!filterObj.search?.trim(),
                mostUsedSort: filterObj.sort,
                lastUpdated: Date.now() // In a real app, track actual usage
            };
        });
        
        return stats;
    }
});
