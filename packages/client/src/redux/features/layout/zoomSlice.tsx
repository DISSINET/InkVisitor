import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: number = 0;

const zoomSlice = createSlice({
  name: "zoom",
  initialState: initialState,
  reducers: {
    setZoom: (state: number, action: PayloadAction<number>) =>
      (state = action.payload),
  },
});

export const { setZoom } = zoomSlice.actions;

export default zoomSlice.reducer;
