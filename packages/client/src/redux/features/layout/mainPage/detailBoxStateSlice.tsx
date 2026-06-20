import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DetailBoxState } from "types";

const storedDetailBoxState = localStorage.getItem("detailBoxState");
const initialState: DetailBoxState =
  storedDetailBoxState &&
  Object.values(DetailBoxState).includes(storedDetailBoxState as DetailBoxState)
    ? (storedDetailBoxState as DetailBoxState)
    : DetailBoxState.Normal;

const detailBoxStateSlice = createSlice({
  name: "detailBoxState",
  initialState: initialState,
  reducers: {
    setDetailBoxState: (
      state: DetailBoxState,
      action: PayloadAction<DetailBoxState>
    ) => {
      state = action.payload;
      localStorage.setItem("detailBoxState", action.payload);
      return state;
    },
  },
});

export const { setDetailBoxState } = detailBoxStateSlice.actions;

export default detailBoxStateSlice.reducer;
