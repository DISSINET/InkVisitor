import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface DraggedItem {
  id?: string;
  parentId?: string;
  index?: number;
}
const initialState: DraggedItem = {};

const draggedTerritorySlice = createSlice({
  name: "draggedTerritory",
  initialState: initialState,
  reducers: {
    setDraggedTerritoryPath: (
      state: DraggedItem,
      action: PayloadAction<DraggedItem>
    ) => (state = action.payload),
  },
});

export const { setDraggedTerritoryPath } = draggedTerritorySlice.actions;

export default draggedTerritorySlice.reducer;
