import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EditorBoxState } from "types";

const initialState: EditorBoxState = localStorage.getItem("editorBoxState")
  ? (localStorage.getItem("editorBoxState") as EditorBoxState)
  : EditorBoxState.Normal;

const editorBoxStateSlice = createSlice({
  name: "editorBoxState",
  initialState: initialState,
  reducers: {
    setEditorBoxState: (
      state: EditorBoxState,
      action: PayloadAction<EditorBoxState>
    ) => {
      state = action.payload;
      localStorage.setItem("editorBoxState", action.payload);
      return state;
    },
  },
});

export const { setEditorBoxState } = editorBoxStateSlice.actions;

export default editorBoxStateSlice.reducer;
