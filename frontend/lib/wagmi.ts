import { createConfig, http, type CreateConnectorFn } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

export const RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";

const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim();
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sealqr.app";

/** WalletConnect lights up only when a project id is configured (avoids a hard
 *  crash at module load when the env var is missing). Injected is always on. */
export const walletConnectEnabled = Boolean(WC_PROJECT_ID);

const connectors: CreateConnectorFn[] = [injected({ shimDisconnect: true })];
if (WC_PROJECT_ID) {
  connectors.push(
    walletConnect({
      projectId: WC_PROJECT_ID,
      showQrModal: true,
      metadata: {
        name: "SealQR",
        description: "Confidential payments & red packets on Zama FHEVM",
        url: APP_URL,
        icons: [`${APP_URL}/icon.svg`],
      },
    }),
  );
}

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors,
  transports: {
    [sepolia.id]: http(RPC_URL),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
