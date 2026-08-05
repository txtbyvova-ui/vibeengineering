import React from "react";
import ReactDOM from "react-dom/client";
import { MotionConfig } from "framer-motion";
import App from "@/App";
import "@/index.css";

// CSS-медиаблок гасит только CSS-анимации; Framer Motion анимирует inline-стили
// через rAF и о нём не знает — поэтому вторая половина фикса нужна здесь.
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </React.StrictMode>
);
