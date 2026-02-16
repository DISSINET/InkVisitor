import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: boolean = false;

const modalOpenSlice = createSlice({
  name: "modalOpen",
  initialState: initialState,
  reducers: {
    setModalOpen: (state: boolean, action: PayloadAction<boolean>) =>
      (state = action.payload),
  },
});

export const { setModalOpen } = modalOpenSlice.actions;

export default modalOpenSlice.reducer;
