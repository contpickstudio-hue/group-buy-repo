export const createUserSlice = (set, get) => ({
  // Helper data state
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

  updateHelperData: (updates) => {
    set((state) => {
      Object.assign(state.helperData, updates);
    });
  },

  setHelperStep: (stepIndex) => {
    set((state) => {
      state.helperStepIndex = stepIndex;
    });
  }
});

