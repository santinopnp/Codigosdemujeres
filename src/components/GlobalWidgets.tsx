import React from "react";
import LeadPopup from "./LeadPopup";

/* ------------------------------------------------------------------ */
/*  GlobalWidgets – Renders floating widgets on all public pages        */
/*  Placed inside the router layout so it appears across routes.       */
/* ------------------------------------------------------------------ */

export default function GlobalWidgets() {
  return <LeadPopup />;
}
