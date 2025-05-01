import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// This reducer is handled in the main page component automatically related to the detail box state
const initialState: boolean = localStorage.getItem("statementListOpened")
  ? localStorage.getItem("statementListOpened") === "true"
  : true;

const statementListOpenedSlice = createSlice({
  name: "statementListOpened",
  initialState: initialState,
  reducers: {
    setStatementListOpened: (
      state: boolean,
      action: PayloadAction<boolean>
    ) => {
      localStorage.setItem("statementListOpened", action.payload.toString());
      return action.payload;
    },
  },
});

export const { setStatementListOpened } = statementListOpenedSlice.actions;

export default statementListOpenedSlice.reducer;
