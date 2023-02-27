import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: number = -1;

const lastClickedIndexSlice = createSlice({
  name: "lastClickedIndex",
  initialState: initialState,
  reducers: {
    setLastClickedIndex: (state: number, action: PayloadAction<number>) =>
      (state = action.payload),
  },
});

export const { setLastClickedIndex } = lastClickedIndexSlice.actions;

export default lastClickedIndexSlice.reducer;
