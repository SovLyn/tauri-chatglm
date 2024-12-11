import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";
import "./global.css";
import Layout from "./Layout";
import Chat from "./pages/Chat";
import More from "./pages/More";
import { Provider } from "react-redux";
import { createStore } from "./redux/store";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "/", element: <Chat /> },
      { path: "/more", element: <More /> },
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
