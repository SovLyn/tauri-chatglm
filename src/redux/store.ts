import { configureStore } from "@reduxjs/toolkit";
import { commonReducer } from "./slices/common";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { chatReducer } from "./slices/chat";

export function createStore() {
  let state = configureStore({
    reducer: {
      common: commonReducer,
      chat: chatReducer,
    },
  });
  return state;
}

type StoreType = ReturnType<typeof createStore>;
export type RootState = ReturnType<StoreType["getState"]>;
export type AppDispatch = StoreType["dispatch"];

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
