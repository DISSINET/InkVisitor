import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: boolean = false;

const disableUserSelectSlice = createSlice({
  name: "disableUserSelect",
  initialState: initialState,
  reducers: {
    setDisableUserSelect: (state: boolean, action: PayloadAction<boolean>) =>
      (state = action.payload),
  },
});

export const { setDisableUserSelect } = disableUserSelectSlice.actions;

export default disableUserSelectSlice.reducer;
