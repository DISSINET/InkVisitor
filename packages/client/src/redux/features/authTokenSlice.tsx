import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: string = "";

const authTokenSlice = createSlice({
  name: "token",
  initialState,
  reducers: {
    setAuthToken: (state: string, action: PayloadAction<string>) =>
      (state = action.payload),
  },
});

export const { setAuthToken } = authTokenSlice.actions;

export default authTokenSlice.reducer;
