import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

export interface CommonState {
  theme: "system" | "light" | "dark";
  token?: string;
}

export const initialState: CommonState = {
  theme:
    localStorage.getItem("theme") === "light"
      ? "light"
      : localStorage.getItem("theme") === "dark"
      ? "dark"
      : "system",
  token: "deef813d1e39116bb41f8fef36187370.5sGgf0UXHIo4tfw4",
};

export const commonSlice = createSlice({
  name: "common",
  initialState,
  reducers: {
    setTheme: (state: CommonState, action) => {
      state.theme = action.payload;
    },
    setToken: (state: CommonState, action) => {
      state.token = action.payload;
    },
  },
});

export const { setTheme, setToken } = commonSlice.actions;

export const selectTheme = (state: RootState) => state.common.theme;
export const selectToken = (state: RootState) => state.common.token;

export const commonReducer = commonSlice.reducer;
