import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { HashRouter as Router } from "react-router-dom";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);

createRoot(document.getElementById("root")!).render(
   <StrictMode>
      <Router>
         <App />
      </Router>
   </StrictMode>
);

// if ("serviceWorker" in navigator) {
//    window.addEventListener("load", () => {
//       navigator.serviceWorker
//          .register("/sw.js")
//          .then((registration) => {
//             console.log("SW registrado:", registration);
//          })
//          .catch((error) => {
//             console.error("SW registro fallido:", error);
//          });
//    });
