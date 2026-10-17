import React, { useState, useEffect } from "react";

/* ------------------------------------------------------------------ */
/*  WhatsAppButton – Floating green WhatsApp CTA                       */
/*  Appears fixed on screen with entrance animation after 2 seconds.   */
/* ------------------------------------------------------------------ */

interface WhatsAppButtonProps {
  phone?: string;
}

export default function WhatsAppButton({
  phone = "573000000000",
}: WhatsAppButtonProps) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  function handleClick() {
    window.open(`https://wa.me/${phone}`, "_blank", "noopener");
  }

  return (
    <>
      <style>{`
        @media (max-width: 639px) {
          .wa-float-btn {
            bottom: 72px !important;
          }
          .wa-float-btn button {
            width: 48px !important;
            height: 48px !important;
          }
          .wa-float-btn button svg {
            width: 24px !important;
            height: 24px !important;
          }
        }
      `}</style>

      <div
        className="wa-float-btn"
        style={{
          position: "fixed",
          bottom: 90,
          right: 20,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: 8,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
          pointerEvents: visible ? "auto" : "none",
        }}
      >
        {/* Tooltip */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            color: "#2B2B2B",
            fontSize: 13,
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 600,
            padding: "6px 12px",
            borderRadius: 8,
            boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
            whiteSpace: "nowrap",
            opacity: hovered ? 1 : 0,
            transform: hovered ? "translateX(0)" : "translateX(8px)",
            transition: "opacity 0.2s ease, transform 0.2s ease",
            pointerEvents: "none",
          }}
        >
          ¿Necesitas ayuda?
        </div>

        {/* Button */}
        <button
          onClick={handleClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
          aria-label="Contactar por WhatsApp"
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            backgroundColor: "#25D366",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: hovered
              ? "0 6px 20px rgba(37,211,102,0.5)"
              : "0 4px 14px rgba(37,211,102,0.35)",
            transform: hovered ? "scale(1.1)" : "scale(1)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            flexShrink: 0,
          }}
        >
          <svg viewBox="0 0 24 24" fill="white" width="28" height="28">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.347 0-4.518-.803-6.236-2.152l-.362-.303-3.726 1.249 1.249-3.726-.303-.362A9.935 9.935 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" />
          </svg>
        </button>
      </div>
    </>
  );
}
