import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import FacebookPixel from "./components/FacebookPixel";
import "./styles/globals.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <React.StrictMode>
    <FacebookPixel />
    <RouterProvider router={router} />
  </React.StrictMode>
);
