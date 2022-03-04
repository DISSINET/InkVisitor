import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DraggedPropRowItem } from "types";

const initialState: DraggedPropRowItem = {};

const draggedPropRowSlice = createSlice({
  name: "draggedPropRow",
  initialState: initialState,
  reducers: {
    setDraggedPropRow: (
      state: DraggedPropRowItem,
      action: PayloadAction<DraggedPropRowItem>
    ) => (state = action.payload),
  },
});

export const { setDraggedPropRow } = draggedPropRowSlice.actions;

export default draggedPropRowSlice.reducer;
