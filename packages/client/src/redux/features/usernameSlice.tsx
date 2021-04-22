import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: string | null = localStorage.getItem("username");

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
