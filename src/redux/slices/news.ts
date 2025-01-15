import { createSlice } from "@reduxjs/toolkit";

export interface NewsState {
  token: string;
  push_news: boolean;
}

const initialState: NewsState = {
  token: localStorage.getItem("news")
    ? JSON.parse(localStorage.getItem("news") || "")?.token ?? ""
    : "",
  push_news: localStorage.getItem("news")
    ? JSON.parse(localStorage.getItem("news") || "")?.push_news ?? false
    : false,
};

export const newsSlice = createSlice({
  name: "news",
  initialState,
  reducers: {
    setNewsToken: (state, action) => {
      state.token = action.payload;
      localStorage.setItem("news", JSON.stringify(state));
    },
    setPushNews: (state, action) => {
      state.push_news = action.payload;
      localStorage.setItem("news", JSON.stringify(state));
    },
  },
});

export const { setNewsToken, setPushNews } = newsSlice.actions;

export const newsReducer = newsSlice.reducer;
