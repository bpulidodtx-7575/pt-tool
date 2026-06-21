import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import PlagiocephalyTool from "./PlagiocephalyTool";
import { ErrorBoundary } from "./ErrorBoundary";
import PwaReloadPrompt from "./PwaReloadPrompt";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <PlagiocephalyTool />
    </ErrorBoundary>
    <PwaReloadPrompt />
  </React.StrictMode>,
);
