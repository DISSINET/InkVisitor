import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const includeSubordinatesStorageKey = "includeSubordinates";

const initialState: boolean =
  localStorage.getItem(includeSubordinatesStorageKey) === "true";

const includeSubordinatesSlice = createSlice({
  name: "entitySearchIncludeSubordinates",
  initialState: initialState,
  reducers: {
    setIncludeSubordinates: (
      state: boolean,
      action: PayloadAction<boolean>
    ) => (state = action.payload),
  },
});

export const { setIncludeSubordinates } = includeSubordinatesSlice.actions;

export default includeSubordinatesSlice.reducer;
