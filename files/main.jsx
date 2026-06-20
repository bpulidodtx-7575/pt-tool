import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import PlagiocephalyTool from "./PlagiocephalyTool";
import { ErrorBoundary } from "./ErrorBoundary";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <PlagiocephalyTool />
    </ErrorBoundary>
  </React.StrictMode>,
);
