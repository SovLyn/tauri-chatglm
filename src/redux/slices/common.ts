import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

export interface CommonState {
  theme: string;
}

export const initialState: CommonState = {
  theme: localStorage.getItem("theme") || "light",
};

export const commonSlice = createSlice({
  name: "common",
  initialState,
  reducers: {
    setTheme: (state: CommonState, action) => {
      state.theme = action.payload;
    },
  },
});

export const { setTheme } = commonSlice.actions;

export const selectTheme = (state: RootState) => state.common.theme;

export const commonReducer = commonSlice.reducer;
