import { Message } from "@/utils/chatglm";
import { createSlice } from "@reduxjs/toolkit";

export interface ChatState {
  input: string;
  messages: Message[];
  annotation: string;
}

export const initialState: ChatState = {
  input: "",
  messages: JSON.parse(localStorage.getItem("messages") ?? "[]"),
  annotation: localStorage.getItem("annotation") ?? "",
};

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setInput: (state: ChatState, action) => {
      state.input = action.payload;
    },
    setMessages: (state: ChatState, action) => {
      state.messages = action.payload;
    },
    onSendMessage: (state: ChatState, action) => {
      state.messages.push(action.payload);
      localStorage.setItem("messages", JSON.stringify(state.messages));
      state.messages.push({
        role: "assistant",
        content: "",
      });
    },
    onAppendAnswer: (state: ChatState, action) => {
      state.messages[state.messages.length - 1].content += action.payload;
    },
    onFailToSend: (state: ChatState, action) => {
      state.messages.pop();
      state.messages.push({
        role: "assistant",
        content: "发送失败，请重试, 错误：" + action.payload,
      });
      localStorage.setItem("messages", JSON.stringify(state.messages));
    },
    setAnnotation: (state: ChatState, action) => {
      localStorage.setItem("annotation", action.payload);
      state.annotation = action.payload;
    },
  },
});

export const {
  setInput,
  setMessages,
  onSendMessage,
  onAppendAnswer,
  onFailToSend,
  setAnnotation,
} = chatSlice.actions;

export const selectInput = (state: { chat: ChatState }) => state.chat.input;
export const selectMessages = (state: { chat: ChatState }) =>
  state.chat.messages;
export const selectAnnotation = (state: { chat: ChatState }) =>
  state.chat.annotation;

export const chatReducer = chatSlice.reducer;
