import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: string[] = [];

const rowsExpandedSlice = createSlice({
  name: "rowsExpanded",
  initialState: initialState,
  reducers: {
    setRowsExpanded: (state: string[], action: PayloadAction<string[]>) =>
      (state = action.payload),
  },
});

export const { setRowsExpanded } = rowsExpandedSlice.actions;

export default rowsExpandedSlice.reducer;
