import { createSlice, configureStore } from '@reduxjs/toolkit'

const budgetSlice = createSlice({
  name: 'budget',
  initialState: {
    selectedTypes: [],
    payment: 1000,
    downpay: 2000,
    months: 24
  },
  reducers: {
    setSelectedTypes(state, action) {
      state.selectedTypes = action.payload;
    },
    setPayment(state, action) {
        state.payment = action.payload;
    },
    setDownpay(state, action) {
        state.downpay = action.payload;
    },
    setMonths(state, action) {
        state.months = action.payload;
    },
  },
})

export const budgetActions = budgetSlice.actions

const store = configureStore({
  reducer: {budget: budgetSlice.reducer}
})

export default store;