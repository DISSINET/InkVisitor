import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: string[] = [""];

const selectedTerritoryPathSlice = createSlice({
  name: "selectedTerritoryPath",
  initialState: initialState,
  reducers: {
    setSelectedTerritoryPath: (
      state: string[],
      action: PayloadAction<string[]>
    ) => (state = action.payload),
  },
});

export const { setSelectedTerritoryPath } = selectedTerritoryPathSlice.actions;

export default selectedTerritoryPathSlice.reducer;
