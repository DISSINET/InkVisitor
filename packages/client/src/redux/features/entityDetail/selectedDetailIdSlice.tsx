import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const selectedDetailIdSlice = createSlice({
  name: "selectedDetailId",
  initialState: "",
  reducers: {
    setSelectedDetailId: (state: string, action: PayloadAction<string>) =>
      (state = action.payload),
  },
});

export const { setSelectedDetailId } = selectedDetailIdSlice.actions;

export default selectedDetailIdSlice.reducer;
