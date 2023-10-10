import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: string = localStorage.getItem("theme")
  ? (localStorage.getItem("theme") as string)
  : "light";

const themeSlice = createSlice({
  name: "theme",
  initialState: initialState,
  reducers: {
    setTheme: (state: string, action: PayloadAction<string>) =>
      (state = action.payload),
  },
});

export const { setTheme } = themeSlice.actions;

export default themeSlice.reducer;
