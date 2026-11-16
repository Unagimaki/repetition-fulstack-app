import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App";
import { Theme } from "@radix-ui/themes";
import { store } from "./app/store";
import "@radix-ui/themes/styles.css";
import "./app/styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Theme accentColor="jade" grayColor="slate" radius="large" scaling="100%" panelBackground="solid">
          <App />
        </Theme>
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
