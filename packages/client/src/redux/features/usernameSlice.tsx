import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { getStoredUsername } from "utils/userStorage";

const initialState: string | null = getStoredUsername();

const usernameSlice = createSlice({
  name: "username",
  initialState: initialState || "",
  reducers: {
    setUsername: (state: string, action: PayloadAction<string>) =>
      (state = action.payload),
  },
});

export const { setUsername } = usernameSlice.actions;

export default usernameSlice.reducer;
