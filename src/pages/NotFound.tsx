import React from "react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  const userLang = navigator.language.toLowerCase();
  const isIt = userLang.startsWith("it");
  const isEs = !userLang.startsWith("en") && !isIt;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ backgroundColor: "#FBF7F1" }}
    >
      <span
        className="font-editorial text-xl mb-12"
        style={{ color: "#C2506A", letterSpacing: "0.02em" }}
      >
        Códigos
      </span>

      <div
        className="flex items-center justify-center mb-6"
        style={{
          width: 72,
          height: 72,
          backgroundColor: "#F3EBE0",
          border: "2px solid #D9C9B0",
          borderRadius: 12,
        }}
      >
        <span
          className="font-editorial"
          style={{ fontSize: "1.75rem", color: "#A89882" }}
        >
          404
        </span>
      </div>

      <h1
        className="mb-3 text-center"
        style={{ fontSize: "1.5rem", color: "#3D2B1F" }}
      >
        {isIt ? "Pagina non trovata" : isEs ? "Página no encontrada" : "Page not found"}
      </h1>
      <p
        className="text-sm mb-8 text-center"
        style={{ color: "#A89882", maxWidth: 300 }}
      >
        {isIt ? "La pagina che cerchi non esiste."
               : isEs ? "La página que buscas no existe."
               : "The page you're looking for doesn't exist."}
      </p>

      <div style={{ width: "100%", maxWidth: 280 }}>
        <button className="btn-primary" onClick={() => navigate("/")}>
          {isIt ? "Torna alla home" : isEs ? "Volver al inicio" : "Back to home"}
        </button>
      </div>
    </div>
  );
}
