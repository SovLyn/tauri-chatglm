import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

export enum Model {
  GLM_4_PLUS = "GLM-4-Plus",
  GLM_4_0520 = "GLM-4-0520",
  GLM_4_LONG = "GLM-4-Long",
  GLM_4_AIRX = "GLM-4-AirX",
  GLM_4_AIR = "GLM-4-Air",
  GLM_4_FLASHX = "GLM-4-FlashX",
  GLM_4_FLASH = "GLM-4-Flash",
}

export interface CommonState {
  theme: "system" | "light" | "dark";
  model: Model;
  token?: string;
}

export const initialState: CommonState = {
  theme:
    localStorage.getItem("theme") === "light"
      ? "light"
      : localStorage.getItem("theme") === "dark"
      ? "dark"
      : "system",
  model: (localStorage.getItem("model") as Model) || "GLM-4-Flash",
  token: localStorage.getItem("token") || undefined,
};

export const commonSlice = createSlice({
  name: "common",
  initialState,
  reducers: {
    setTheme: (state: CommonState, action) => {
      localStorage.setItem("theme", action.payload);
      document.body.className =
        action.payload !== "system"
          ? action.payload
          : matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      state.theme = action.payload;
    },
    setToken: (state: CommonState, action) => {
      state.token = action.payload;
      console.log("setToken", action);
      localStorage.setItem("token", action.payload);
    },
    setModel: (state: CommonState, action) => {
      state.model = action.payload;
      localStorage.setItem("model", action.payload);
    },
  },
});

export const { setTheme, setToken, setModel } = commonSlice.actions;

export const selectTheme = (state: RootState) => state.common.theme;
export const selectToken = (state: RootState) => state.common.token;
export const selectModel = (state: RootState) => state.common.model;

export const commonReducer = commonSlice.reducer;
