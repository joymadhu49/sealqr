"use client";

import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { ServiceWorkerRegister } from "./ServiceWorker";
import { ZamaBadge } from "./ZamaBadge";
import { WalletSheet } from "@/components/wallet/WalletSheet";
import { NetworkBanner } from "@/components/wallet/NetworkBanner";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col">
      <Header />
      <NetworkBanner />
      <main className="flex-1 px-4 pb-36 pt-2">
        {children}
        <ZamaBadge />
      </main>
      <BottomNav />
      <WalletSheet />
      <ServiceWorkerRegister />
    </div>
  );
}
