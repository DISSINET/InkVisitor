import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: string | null = localStorage.getItem("token");

const authTokenSlice = createSlice({
  name: "token",
  initialState: initialState || "",
  reducers: {
    setAuthToken: (state: string, action: PayloadAction<string>) =>
      (state = action.payload),
  },
});

export const { setAuthToken } = authTokenSlice.actions;

export default authTokenSlice.reducer;
