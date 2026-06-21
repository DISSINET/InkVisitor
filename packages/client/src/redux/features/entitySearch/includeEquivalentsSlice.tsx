import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const includeEquivalentsStorageKey = "includeEquivalents";

const initialState: boolean =
  localStorage.getItem(includeEquivalentsStorageKey) === "true";

const includeEquivalentsSlice = createSlice({
  name: "entitySearchIncludeEquivalents",
  initialState: initialState,
  reducers: {
    setIncludeEquivalents: (
      state: boolean,
      action: PayloadAction<boolean>
    ) => (state = action.payload),
  },
});

export const { setIncludeEquivalents } = includeEquivalentsSlice.actions;

export default includeEquivalentsSlice.reducer;
