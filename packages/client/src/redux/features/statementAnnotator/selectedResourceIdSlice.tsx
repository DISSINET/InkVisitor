import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: string | false = false;

const selectedResourceIdSlice = createSlice({
  name: "selectedResourceId",
  initialState: initialState as string | false,
  reducers: {
    setSelectedResourceId: (
      state: string | false,
      action: PayloadAction<string | false>
    ) => (state = action.payload),
  },
});

export const { setSelectedResourceId } = selectedResourceIdSlice.actions;

export default selectedResourceIdSlice.reducer;
