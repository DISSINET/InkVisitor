import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: boolean = localStorage.getItem("firstPanelExpanded")
  ? localStorage.getItem("firstPanelExpanded") === "true"
  : true;

const firstPanelExpandedSlice = createSlice({
  name: "firstPanelExpanded",
  initialState: initialState,
  reducers: {
    setFirstPanelExpanded: (state: boolean, action: PayloadAction<boolean>) => {
      localStorage.setItem("firstPanelExpanded", action.payload.toString());
      return action.payload;
    },
  },
});

export const { setFirstPanelExpanded } = firstPanelExpandedSlice.actions;

export default firstPanelExpandedSlice.reducer;
