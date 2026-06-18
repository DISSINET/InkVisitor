import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AnnotatorBoxState } from "types";

const initialState: AnnotatorBoxState = localStorage.getItem("annotatorBoxState")
  ? (localStorage.getItem("annotatorBoxState") as AnnotatorBoxState)
  : AnnotatorBoxState.Normal;

const annotatorBoxStateSlice = createSlice({
  name: "annotatorBoxState",
  initialState: initialState,
  reducers: {
    setAnnotatorBoxState: (
      state: AnnotatorBoxState,
      action: PayloadAction<AnnotatorBoxState>
    ) => {
      state = action.payload;
      localStorage.setItem("annotatorBoxState", action.payload);
      return state;
    },
  },
});

export const { setAnnotatorBoxState } = annotatorBoxStateSlice.actions;

export default annotatorBoxStateSlice.reducer;
