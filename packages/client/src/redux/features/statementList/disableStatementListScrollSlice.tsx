import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: boolean = false;

const disableStatementListScrollSlice = createSlice({
  name: "disableStatementListScroll",
  initialState: initialState,
  reducers: {
    setDisableStatementListScroll: (
      state: boolean,
      action: PayloadAction<boolean>
    ) => (state = action.payload),
  },
});

export const { setDisableStatementListScroll } =
  disableStatementListScrollSlice.actions;

export default disableStatementListScrollSlice.reducer;
