import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: number = 0;

const thirdPanelRealWidthSlice = createSlice({
  name: "thirdPanelRealWidth",
  initialState: initialState,
  reducers: {
    setThirdPanelRealWidth: (state: number, action: PayloadAction<number>) =>
      (state = action.payload),
  },
});

export const { setThirdPanelRealWidth } = thirdPanelRealWidthSlice.actions;

export default thirdPanelRealWidthSlice.reducer;
