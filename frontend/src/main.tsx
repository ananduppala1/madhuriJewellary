import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import "./styles.css";
import { router } from "./routes";

const container = document.getElementById("root");
if (!container) throw new Error('Root element "#root" not found in index.html');

createRoot(container).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
