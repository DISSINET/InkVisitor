import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DraggedEntityReduxItem } from "types";

const initialState: DraggedEntityReduxItem = {};

const draggedEntitySlice = createSlice({
  name: "draggedEntity",
  initialState: initialState,
  reducers: {
    setDraggedEntity: (
      state: DraggedEntityReduxItem,
      action: PayloadAction<DraggedEntityReduxItem>
    ) => (state = action.payload),
  },
});

export const { setDraggedEntity } = draggedEntitySlice.actions;

export default draggedEntitySlice.reducer;
