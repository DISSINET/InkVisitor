import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: string = "light";

const themeSlice = createSlice({
  name: "ping",
  initialState: initialState,
  reducers: {
    setTheme: (state: string, action: PayloadAction<string>) =>
      (state = action.payload),
  },
});

export const { setTheme } = themeSlice.actions;

export default themeSlice.reducer;
