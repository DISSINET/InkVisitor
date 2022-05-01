import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: string = "";

const draggedRowIdSlice = createSlice({
  name: "draggedRowId",
  initialState: initialState,
  reducers: {
    setDraggedRowId: (state: string, action: PayloadAction<string>) =>
      (state = action.payload),
  },
});

export const { setDraggedRowId } = draggedRowIdSlice.actions;

export default draggedRowIdSlice.reducer;
