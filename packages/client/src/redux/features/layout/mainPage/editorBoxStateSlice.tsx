import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EditorBoxState } from "types";

const storedEditorBoxState = localStorage.getItem("editorBoxState");
const initialState: EditorBoxState =
  storedEditorBoxState &&
  Object.values(EditorBoxState).includes(storedEditorBoxState as EditorBoxState)
    ? (storedEditorBoxState as EditorBoxState)
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
