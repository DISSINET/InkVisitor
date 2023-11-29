import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { InterfaceEnums } from "@shared/enums";

const initialState: InterfaceEnums.Theme = localStorage.getItem("theme")
  ? (localStorage.getItem("theme") as InterfaceEnums.Theme)
  : InterfaceEnums.Theme.Light;

const themeSlice = createSlice({
  name: "theme",
  initialState: initialState,
  reducers: {
    setTheme: (
      state: InterfaceEnums.Theme,
      action: PayloadAction<InterfaceEnums.Theme>
    ) => (state = action.payload),
  },
});

export const { setTheme } = themeSlice.actions;

export default themeSlice.reducer;
