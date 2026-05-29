// Hand-authored ABIs limited to what the frontend calls. Kept in sync with
// /contracts/contracts/*.sol. euint64 handles are returned as bytes32.

export const confidentialUSDAbi = [
  { type: "function", name: "faucet", stateMutability: "nonpayable", inputs: [], outputs: [] },
  {
    type: "function",
    name: "confidentialBalanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "bytes32" }],
  },
  {
    type: "function",
    name: "setOperator",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "until", type: "uint48" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "isOperator",
    stateMutability: "view",
    inputs: [
      { name: "holder", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "bool" }],
  },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  {
    type: "function",
    name: "lastFaucet",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  { type: "event", name: "FaucetClaimed", inputs: [{ name: "to", type: "address", indexed: true }] },
] as const;

export const redPacketVaultAbi = [
  {
    type: "function",
    name: "createPacket",
    stateMutability: "nonpayable",
    inputs: [
      { name: "encAmounts", type: "bytes32[]" },
      { name: "inputProof", type: "bytes" },
      { name: "auth", type: "address" },
      { name: "memo", type: "string" },
    ],
    outputs: [{ name: "packetId", type: "uint256" }],
  },
  {
    type: "function",
    name: "claim",
    stateMutability: "nonpayable",
    inputs: [
      { name: "packetId", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [{ name: "slot", type: "uint32" }],
  },
  {
    type: "function",
    name: "grantAuditor",
    stateMutability: "nonpayable",
    inputs: [
      { name: "packetId", type: "uint256" },
      { name: "auditor", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getPacket",
    stateMutability: "view",
    inputs: [{ name: "packetId", type: "uint256" }],
    outputs: [
      { name: "creator", type: "address" },
      { name: "count", type: "uint32" },
      { name: "claimed", type: "uint32" },
      { name: "createdAt", type: "uint64" },
      { name: "auth", type: "address" },
      { name: "total", type: "bytes32" },
      { name: "memo", type: "string" },
    ],
  },
  {
    type: "function",
    name: "getSlotAmount",
    stateMutability: "view",
    inputs: [
      { name: "packetId", type: "uint256" },
      { name: "slot", type: "uint32" },
    ],
    outputs: [{ type: "bytes32" }],
  },
  {
    type: "function",
    name: "claimInfo",
    stateMutability: "view",
    inputs: [
      { name: "packetId", type: "uint256" },
      { name: "wallet", type: "address" },
    ],
    outputs: [
      { name: "claimed", type: "bool" },
      { name: "slot", type: "uint32" },
      { name: "amount", type: "bytes32" },
    ],
  },
  {
    type: "function",
    name: "hasClaimed",
    stateMutability: "view",
    inputs: [
      { name: "packetId", type: "uint256" },
      { name: "wallet", type: "address" },
    ],
    outputs: [{ type: "bool" }],
  },
  { type: "function", name: "nextPacketId", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    type: "event",
    name: "PacketCreated",
    inputs: [
      { name: "packetId", type: "uint256", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "count", type: "uint32", indexed: false },
      { name: "memo", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Claimed",
    inputs: [
      { name: "packetId", type: "uint256", indexed: true },
      { name: "slot", type: "uint32", indexed: true },
      { name: "claimer", type: "address", indexed: true },
    ],
  },
] as const;

export const confidentialPayAbi = [
  {
    type: "function",
    name: "pay",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "nonce", type: "uint256" },
      { name: "encAmount", type: "bytes32" },
      { name: "inputProof", type: "bytes" },
      { name: "memo", type: "string" },
    ],
    outputs: [{ name: "paymentId", type: "uint256" }],
  },
  {
    type: "function",
    name: "grantAuditor",
    stateMutability: "nonpayable",
    inputs: [
      { name: "paymentId", type: "uint256" },
      { name: "auditor", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getPayment",
    stateMutability: "view",
    inputs: [{ name: "paymentId", type: "uint256" }],
    outputs: [
      { name: "payer", type: "address" },
      { name: "recipient", type: "address" },
      { name: "nonce", type: "uint256" },
      { name: "timestamp", type: "uint64" },
      { name: "amount", type: "bytes32" },
      { name: "memo", type: "string" },
    ],
  },
  {
    type: "function",
    name: "nonceUsed",
    stateMutability: "view",
    inputs: [{ name: "", type: "bytes32" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "event",
    name: "PaymentMade",
    inputs: [
      { name: "paymentId", type: "uint256", indexed: true },
      { name: "payer", type: "address", indexed: true },
      { name: "recipient", type: "address", indexed: true },
      { name: "nonce", type: "uint256", indexed: false },
      { name: "memo", type: "string", indexed: false },
    ],
  },
] as const;

export const auditRegistryAbi = [
  {
    type: "function",
    name: "grantsFor",
    stateMutability: "view",
    inputs: [{ name: "auditor", type: "address" }],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "source", type: "address" },
          { name: "refId", type: "uint256" },
          { name: "grantedBy", type: "address" },
          { name: "timestamp", type: "uint64" },
        ],
      },
    ],
  },
] as const;
