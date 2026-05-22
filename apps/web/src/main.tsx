import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { configureAmplify } from "./lib/amplify";
import { AuthBootstrapper } from "./auth/AuthBootstrapper";
import { App } from "./App";
import "./index.css";
import { TanstackQueryProvider } from "./components/providers/TanstackQueryProvider";

configureAmplify();

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("#root element not found in index.html");

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <TanstackQueryProvider>
        <AuthBootstrapper>
          <App />
        </AuthBootstrapper>
      </TanstackQueryProvider>
    </BrowserRouter>
  </StrictMode>,
);
