import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: boolean = localStorage.getItem("statementListOpened")
  ? localStorage.getItem("statementListOpened") === "true"
  : true;

const statementListOpenedSlice = createSlice({
  name: "statementListOpened",
  initialState: initialState,
  reducers: {
    setStatementListOpened: (state: boolean, action: PayloadAction<boolean>) =>
      (state = action.payload),
  },
});

export const { setStatementListOpened } = statementListOpenedSlice.actions;

export default statementListOpenedSlice.reducer;
