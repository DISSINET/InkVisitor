import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DraggedTerritoryItem } from "types";

const initialState: DraggedTerritoryItem = {};

const draggedTerritorySlice = createSlice({
  name: "draggedTerritory",
  initialState: initialState,
  reducers: {
    setDraggedTerritory: (
      state: DraggedTerritoryItem,
      action: PayloadAction<DraggedTerritoryItem>
    ) => (state = action.payload),
  },
});

export const { setDraggedTerritory } = draggedTerritorySlice.actions;

export default draggedTerritorySlice.reducer;
