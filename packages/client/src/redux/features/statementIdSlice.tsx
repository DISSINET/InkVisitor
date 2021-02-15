import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const activeStatementIdSlice = createSlice({
  name: "activeStatementId",
  initialState: "",
  reducers: {
    setActiveStatementId(state: string, action: PayloadAction<string>) {
      state = action.payload;
    },
  },
});

export const { setActiveStatementId } = activeStatementIdSlice.actions;

export default activeStatementIdSlice.reducer;
