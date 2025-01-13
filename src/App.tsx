import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";
import "./global.css";
import Layout from "./Layout";
import Chat from "./pages/Chat";
import Setting from "./pages/Setting";
import { Provider } from "react-redux";
import { createStore } from "./redux/store";
import History from "./pages/History";

if ("__TAURI__" in window) {
  console.log("Tauri is available, __TAURI__: ", window.__TAURI__);
  document.documentElement.style.setProperty("--Application-Opacity", "0.4");
} else {
  console.log("Tauri is not available");
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "/", element: <Chat /> },
      { path: "/setting", element: <Setting /> },
      { path: "/history", element: <History /> },
    ],
  },
]);

function App() {
  const store = createStore();
  let theme = store.getState().common.theme;
  if (theme === "system") {
    theme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  document.body.className = theme;
  return (
    <Provider store={createStore()}>
      <RouterProvider router={router} />
    </Provider>
  );
}

export default App;
