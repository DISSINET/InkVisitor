import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: string | null = null;

const hoveredStatementIdSlice = createSlice({
  name: "hoveredStatementId",
  initialState: initialState as string | null,
  reducers: {
    setHoveredStatementId: (
      state: string | null,
      action: PayloadAction<string | null>
    ) => (state = action.payload),
  },
});

export const { setHoveredStatementId } = hoveredStatementIdSlice.actions;

export default hoveredStatementIdSlice.reducer;
