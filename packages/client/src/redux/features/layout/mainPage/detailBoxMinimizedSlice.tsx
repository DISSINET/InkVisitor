import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: boolean = localStorage.getItem("detailBoxMinimized")
  ? localStorage.getItem("detailBoxMinimized") === "true"
  : false;

const detailBoxMinimizedSlice = createSlice({
  name: "detailBoxMinimized",
  initialState: initialState,
  reducers: {
    setDetailBoxMinimized: (state: boolean, action: PayloadAction<boolean>) => {
      localStorage.setItem("detailBoxMinimized", action.payload.toString());
      return action.payload;
    },
  },
});

export const { setDetailBoxMinimized } = detailBoxMinimizedSlice.actions;

export default detailBoxMinimizedSlice.reducer;
