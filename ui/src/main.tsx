import "regenerator-runtime/runtime";
import React from "react";
import ReactDOM from "react-dom/client";
import CssBaseline from "@mui/material/CssBaseline";
import { DockerMuiThemeProvider } from "@docker/docker-mui-theme";
import { App } from "./App";
import { CodeContextProvider } from "./useCodeContext";
import { MessageContextProvider } from "./useMessagesContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <DockerMuiThemeProvider>
      <CssBaseline />
      <MessageContextProvider>
        <CodeContextProvider>
          <App />
        </CodeContextProvider>
      </MessageContextProvider>
    </DockerMuiThemeProvider>
  </React.StrictMode>
);
