import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'registration',
  initialState: {
    step: 1 as number,
    data: {} as any,
  },
  reducers: {
    setStep(state, action) {
      state.step = action.payload;
    },
    updateData(state, action) {
      state.data = { ...state.data, ...action.payload };
    },
    resetRegistration(state) {
      state.step = 1;
      state.data = {};
    },
  },
});

export const { setStep, updateData, resetRegistration } = slice.actions;
export default slice.reducer;
