import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import PlagiocephalyTool from "./PlagiocephalyTool";
import { ErrorBoundary } from "./ErrorBoundary";
import PwaReloadPrompt from "./PwaReloadPrompt";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Mount node #root is missing from index.html");

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <ErrorBoundary>
      <PlagiocephalyTool />
    </ErrorBoundary>
    <PwaReloadPrompt />
  </React.StrictMode>,
);
