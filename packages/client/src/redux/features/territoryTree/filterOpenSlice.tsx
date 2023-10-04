import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: boolean = false;

const filterOpenSlice = createSlice({
  name: "filterOpen",
  initialState: initialState,
  reducers: {
    setFilterOpen: (state: boolean, action: PayloadAction<boolean>) =>
      (state = action.payload),
  },
});

export const { setFilterOpen } = filterOpenSlice.actions;

export default filterOpenSlice.reducer;
