import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SearchEnums } from "@inkvisitor/shared/enums";

const initialState: SearchEnums.AdvancedOption[] = [];

const expandedOptionsSlice = createSlice({
  name: "entitySearchExpandedOptions",
  initialState: initialState,
  reducers: {
    setExpandedOptions: (
      state: SearchEnums.AdvancedOption[],
      action: PayloadAction<SearchEnums.AdvancedOption[]>
    ) => (state = action.payload),
  },
});

export const { setExpandedOptions } = expandedOptionsSlice.actions;

export default expandedOptionsSlice.reducer;
