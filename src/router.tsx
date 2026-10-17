import React, { lazy, Suspense } from "react";
import { createBrowserRouter, Outlet } from "react-router-dom";
import GlobalWidgets from "@/components/GlobalWidgets";

const StoreLanding  = lazy(() => import("@/pages/StoreLanding"));
const StoreCheckout = lazy(() => import("@/pages/StoreCheckout"));
const Download      = lazy(() => import("@/pages/Download"));
const OrderStatus   = lazy(() => import("@/pages/OrderStatus"));
const Blog          = lazy(() => import("@/pages/Blog"));
const BlogPost      = lazy(() => import("@/pages/BlogPost"));
const Admin         = lazy(() => import("@/pages/Admin"));
const Privacy       = lazy(() => import("@/pages/Privacy"));
const Terms         = lazy(() => import("@/pages/Terms"));
const Refund        = lazy(() => import("@/pages/Refund"));
const ThankYou      = lazy(() => import("@/pages/ThankYou"));
const Library       = lazy(() => import("@/pages/Library"));
const NotFound      = lazy(() => import("@/pages/NotFound"));
const Unsubscribe   = lazy(() => import("@/pages/Unsubscribe"));
const AppHome       = lazy(() => import("@/pages/AppHome"));
const Products      = lazy(() => import("@/pages/Products"));

function PageLoader() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFF1F4", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #F6C6D3", borderTopColor: "#A12B52", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function wrap(Component: React.LazyExoticComponent<() => React.JSX.Element>) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

/** Root layout – renders global floating widgets alongside every page. */
function RootLayout() {
  return (
    <>
      <Outlet />
      <GlobalWidgets />
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/",                  element: wrap(StoreLanding) },
      { path: "/checkout",          element: wrap(StoreCheckout) },
      { path: "/order/:orderId",    element: wrap(OrderStatus) },
      { path: "/thank-you/:orderId", element: wrap(ThankYou) },
      { path: "/download/:token",   element: wrap(Download) },
      { path: "/blog",              element: wrap(Blog) },
      { path: "/blog/:slug",        element: wrap(BlogPost) },
      { path: "/admin",             element: wrap(Admin) },
      { path: "/library/:token",    element: wrap(Library) },
      { path: "/privacidad",        element: wrap(Privacy) },
      { path: "/privacy",           element: wrap(Privacy) },
      { path: "/terminos",          element: wrap(Terms) },
      { path: "/terms",             element: wrap(Terms) },
      { path: "/reembolso",         element: wrap(Refund) },
      { path: "/refund",            element: wrap(Refund) },
      { path: "/rimborso",          element: wrap(Refund) },
      { path: "/unsubscribe",        element: wrap(Unsubscribe) },
      { path: "/app",               element: wrap(AppHome) },
      { path: "/productos",         element: wrap(Products) },
      { path: "/products",          element: wrap(Products) },
      { path: "*",                  element: wrap(NotFound) },
    ],
  },
]);
