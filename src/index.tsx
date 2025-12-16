import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";

const render = () => {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    return;
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
};

if ((window as any).Office) {
  Office.onReady(() => {
    render();
  });
} else {
  // 非 Office 环境下也允许本地调试 UI
  render();
}


