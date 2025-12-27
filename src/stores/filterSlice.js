export const createFilterSlice = (set, get) => ({
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

  resetFilters: () => {
    set((state) => {
      state.filters = {
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
      };
    });
  }
});

