import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initObject = {
  search: true,
  bookmarks: true,
  templates: true,
};

function parseStoredBoxes(): { [key: string]: boolean } {
  const raw = localStorage.getItem("fourthPanelBoxesOpened");
  if (!raw) return initObject;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // corrupted localStorage
  }
  return initObject;
}

const initialState: { [key: string]: boolean } = parseStoredBoxes();

const fourthPanelBoxesOpenedSlice = createSlice({
  name: "fourthPanelBoxesOpened",
  initialState: initialState,
  reducers: {
    setFourthPanelBoxesOpened: (
      state: { [key: string]: boolean },
      action: PayloadAction<{ [key: string]: boolean }>
    ) => {
      localStorage.setItem(
        "fourthPanelBoxesOpened",
        JSON.stringify(action.payload)
      );
      return action.payload;
    },
  },
});

export const { setFourthPanelBoxesOpened } =
  fourthPanelBoxesOpenedSlice.actions;

export default fourthPanelBoxesOpenedSlice.reducer;
