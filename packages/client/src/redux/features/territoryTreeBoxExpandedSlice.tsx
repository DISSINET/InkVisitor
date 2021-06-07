import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: boolean = true;

const territoryTreeBoxExpandedSlice = createSlice({
  name: "territoryTreeBoxExpanded",
  initialState: initialState,
  reducers: {
    setTerritoryTreeBoxExpanded: (
      state: boolean,
      action: PayloadAction<boolean>
    ) => (state = action.payload),
  },
});

export const { setTerritoryTreeBoxExpanded } =
  territoryTreeBoxExpandedSlice.actions;

export default territoryTreeBoxExpandedSlice.reducer;
