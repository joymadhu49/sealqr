import type { Address, Hex } from "viem";

export interface PacketShare {
  code: string; // compact sealqr:… bearer code (for the QR)
  link: string; // shareable https deep link
  authAddr: Address; // ephemeral signer derived from the shared key
}

export interface CreatePacketResult extends PacketShare {
  packetId: string;
}

export interface PacketCard {
  id: string;
  memo: string;
  count: number;
  claimed: number;
  createdAt: number;
  mode?: "equal" | "lucky";
  isCreator: boolean;
  totalKnown?: bigint; // creator-known total (demo + locally remembered live packets)
  totalHandle?: Hex; // live, for on-demand reveal
  share?: PacketShare; // present for packets this device created → re-share
}

export interface PaymentCard {
  id: string;
  payer: Address;
  recipient: Address;
  memo: string;
  ts: number;
  direction: "in" | "out";
  amountKnown?: bigint;
  amountHandle?: Hex;
}
