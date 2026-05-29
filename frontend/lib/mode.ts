import { contractsConfigured } from "./contracts/addresses";

export const FORCE_DEMO = process.env.NEXT_PUBLIC_DEMO === "1";

export type AppMode = "live" | "demo";

export function appMode(): AppMode {
  return contractsConfigured && !FORCE_DEMO ? "live" : "demo";
}
