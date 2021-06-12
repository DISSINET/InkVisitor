import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: number = 0;

const layoutWidthSlice = createSlice({
  name: "layoutWidth",
  initialState: initialState,
  reducers: {
    setLayoutWidth: (state: number, action: PayloadAction<number>) =>
      (state = action.payload),
  },
});

export const { setLayoutWidth } = layoutWidthSlice.actions;

export default layoutWidthSlice.reducer;
