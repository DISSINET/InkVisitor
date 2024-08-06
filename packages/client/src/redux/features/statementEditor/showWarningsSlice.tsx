import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: boolean = false;

const showWarningsSlice = createSlice({
  name: "showWarnings",
  initialState: initialState,
  reducers: {
    setShowWarnings: (state: boolean, action: PayloadAction<boolean>) =>
      (state = action.payload),
  },
});

export const { setShowWarnings } = showWarningsSlice.actions;

export default showWarningsSlice.reducer;
