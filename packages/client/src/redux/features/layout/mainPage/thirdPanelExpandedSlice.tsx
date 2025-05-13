import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: boolean = localStorage.getItem("thirdPanelExpanded")
  ? localStorage.getItem("thirdPanelExpanded") === "true"
  : true;

const thirdPanelExpandedSlice = createSlice({
  name: "thirdPanelExpanded",
  initialState: initialState,
  reducers: {
    setThirdPanelExpanded: (state: boolean, action: PayloadAction<boolean>) =>
      (state = action.payload),
  },
});

export const { setThirdPanelExpanded } = thirdPanelExpandedSlice.actions;

export default thirdPanelExpandedSlice.reducer;
