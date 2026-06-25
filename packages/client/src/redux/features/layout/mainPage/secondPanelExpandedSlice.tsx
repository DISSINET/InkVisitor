import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: boolean = localStorage.getItem("secondPanelExpanded")
  ? localStorage.getItem("secondPanelExpanded") === "true"
  : true;

const secondPanelExpandedSlice = createSlice({
  name: "secondPanelExpanded",
  initialState: initialState,
  reducers: {
    setSecondPanelExpanded: (state: boolean, action: PayloadAction<boolean>) => {
      localStorage.setItem("secondPanelExpanded", action.payload.toString());
      return action.payload;
    },
  },
});

export const { setSecondPanelExpanded } = secondPanelExpandedSlice.actions;

export default secondPanelExpandedSlice.reducer;
