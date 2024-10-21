import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initObject = {
  search: true,
  bookmarks: true,
  templates: true,
};
const storageObject = localStorage.getItem("fourthPanelBoxesOpened");
const initialState: { [key: string]: boolean } = storageObject
  ? JSON.parse(storageObject)
  : initObject;

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
