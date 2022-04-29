import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: { [key: string]: boolean } = {};

const rowsExpandedSlice = createSlice({
  name: "rowsExpanded",
  initialState: initialState,
  reducers: {
    setRowsExpanded: (
      state: { [key: string]: boolean },
      action: PayloadAction<{ [key: string]: boolean }>
    ) => (state = action.payload),
  },
});

export const { setRowsExpanded } = rowsExpandedSlice.actions;

export default rowsExpandedSlice.reducer;
