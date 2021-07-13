import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface DraggedItem {
  id: string;
  index: number;
}
const initialState: DraggedItem | object = {};

const draggedTerritorySlice = createSlice({
  name: "draggedTerritory",
  initialState: initialState,
  reducers: {
    setDraggedTerritoryPath: (
      state: DraggedItem | object,
      action: PayloadAction<DraggedItem | object>
    ) => (state = action.payload),
  },
});

export const { setDraggedTerritoryPath } = draggedTerritorySlice.actions;

export default draggedTerritorySlice.reducer;
