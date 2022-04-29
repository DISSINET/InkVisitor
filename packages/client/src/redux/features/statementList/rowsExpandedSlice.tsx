import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: boolean[] = [];

const rowsExpandedSlice = createSlice({
  name: "rowsExpanded",
  initialState: initialState,
  reducers: {
    setRowsExpanded: (state: boolean[], action: PayloadAction<boolean[]>) =>
      (state = action.payload),
  },
});

export const { setRowsExpanded } = rowsExpandedSlice.actions;

export default rowsExpandedSlice.reducer;
