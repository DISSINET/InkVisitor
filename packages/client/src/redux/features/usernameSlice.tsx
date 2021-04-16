import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: string = "";

const usernameSlice = createSlice({
  name: "username",
  initialState,
  reducers: {
    setUsername: (state: string, action: PayloadAction<string>) =>
      (state = action.payload),
  },
});

export const { setUsername } = usernameSlice.actions;

export default usernameSlice.reducer;
