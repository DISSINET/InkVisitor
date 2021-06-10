import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: boolean = true;

const fourthPanelExpandedSlice = createSlice({
  name: "fourthPanelExpanded",
  initialState: initialState,
  reducers: {
    setFourthPanelExpanded: (state: boolean, action: PayloadAction<boolean>) =>
      (state = action.payload),
  },
});

export const { setFourthPanelExpanded } = fourthPanelExpandedSlice.actions;

export default fourthPanelExpandedSlice.reducer;
