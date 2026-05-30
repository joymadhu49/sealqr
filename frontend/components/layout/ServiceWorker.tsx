"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    // If a worker is already controlling this page, this load is an UPDATE.
    // Reload once when the fresh worker takes over so the user never keeps
    // running stale chunks after a redeploy. Skip the reload on first install
    // (no controller yet) to avoid an unnecessary first-visit refresh.
    const hadController = Boolean(navigator.serviceWorker.controller);
    let reloaded = false;
    const onControllerChange = () => {
      if (reloaded || !hadController) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.update().catch(() => {}))
      .catch(() => {});

    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);
  return null;
}
