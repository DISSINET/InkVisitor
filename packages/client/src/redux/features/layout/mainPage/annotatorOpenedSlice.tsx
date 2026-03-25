import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: boolean = localStorage.getItem("annotatorOpened")
  ? localStorage.getItem("annotatorOpened") === "true"
  : true;

const annotatorOpenedSlice = createSlice({
  name: "annotatorOpened",
  initialState: initialState,
  reducers: {
    setAnnotatorOpened: (state: boolean, action: PayloadAction<boolean>) => {
      localStorage.setItem("annotatorOpened", action.payload.toString());
      return action.payload;
    },
  },
});

export const { setAnnotatorOpened } = annotatorOpenedSlice.actions;

export default annotatorOpenedSlice.reducer;
