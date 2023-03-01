import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: boolean = false;

const disableTreeScrollSlice = createSlice({
  name: "disableTreeScroll",
  initialState: initialState,
  reducers: {
    setDisableTreeScroll: (state: boolean, action: PayloadAction<boolean>) =>
      (state = action.payload),
  },
});

export const { setDisableTreeScroll } = disableTreeScrollSlice.actions;

export default disableTreeScrollSlice.reducer;
