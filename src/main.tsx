import "./lib/mock-fetch"; // demo: intercept /api & /auth with synthetic data (must run first)
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Initialize dark mode before render to avoid flash
const stored = localStorage.getItem("theme");
const prefersDark = stored ? stored === "dark" : false;
if (prefersDark) {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
