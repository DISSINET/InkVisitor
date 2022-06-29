import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: { [key: string]: boolean } = {
  search: true,
  bookmarks: true,
  templates: true,
};

const fourthPanelBoxesOpenedSlice = createSlice({
  name: "fourthPanelBoxesOpened",
  initialState: initialState,
  reducers: {
    setFourthPanelBoxesOpened: (
      state: { [key: string]: boolean },
      action: PayloadAction<{ [key: string]: boolean }>
    ) => (state = action.payload),
  },
});

export const { setFourthPanelBoxesOpened } =
  fourthPanelBoxesOpenedSlice.actions;

export default fourthPanelBoxesOpenedSlice.reducer;
