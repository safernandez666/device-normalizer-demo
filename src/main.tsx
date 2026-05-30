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

// Mock data layer is on by default. Set VITE_USE_MOCK=false in .env to
// disable it (and let Vite tree-shake mock-fetch.ts out of the build) when
// pointing at a real backend.
const useMock = import.meta.env.VITE_USE_MOCK !== "false";
const ready = useMock ? import("./lib/mock-fetch") : Promise.resolve();

ready.then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
