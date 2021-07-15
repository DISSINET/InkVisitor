import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface DraggedItem {
  id?: string;
  parentId?: string;
  index?: number;
  lvl?: number;
}
const initialState: DraggedItem = {};

const draggedTerritorySlice = createSlice({
  name: "draggedTerritory",
  initialState: initialState,
  reducers: {
    setDraggedTerritory: (
      state: DraggedItem,
      action: PayloadAction<DraggedItem>
    ) => (state = action.payload),
  },
});

export const { setDraggedTerritory } = draggedTerritorySlice.actions;

export default draggedTerritorySlice.reducer;
