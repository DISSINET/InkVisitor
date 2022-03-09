import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DraggedActantRowItem } from "types";

const initialState: DraggedActantRowItem = {};

const draggedActantRowSlice = createSlice({
  name: "draggedActantRow",
  initialState: initialState,
  reducers: {
    setDraggedActantRow: (
      state: DraggedActantRowItem,
      action: PayloadAction<DraggedActantRowItem>
    ) => (state = action.payload),
  },
});

export const { setDraggedActantRow } = draggedActantRowSlice.actions;

export default draggedActantRowSlice.reducer;
