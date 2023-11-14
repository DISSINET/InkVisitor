import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: boolean = false;

const showAdvancedOptionsSlice = createSlice({
  name: "showAdvancedOptions",
  initialState: initialState,
  reducers: {
    setShowAdvancedOptions: (state: boolean, action: PayloadAction<boolean>) =>
      (state = action.payload),
  },
});

export const { setShowAdvancedOptions } = showAdvancedOptionsSlice.actions;

export default showAdvancedOptionsSlice.reducer;
