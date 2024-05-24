import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: boolean = false;

const isLoading = createSlice({
  name: "isLoading",
  initialState: initialState,
  reducers: {
    setIsLoading: (state: boolean, action: PayloadAction<boolean>) =>
      (state = action.payload),
  },
});

export const { setIsLoading } = isLoading.actions;

export default isLoading.reducer;
