// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {AuditRegistry} from "./AuditRegistry.sol";

/// @title RedPacketVault
/// @notice Confidential red packets (红包) funded by a single batched confidential
///         disperse. The creator splits a total into N encrypted slot amounts
///         (equal or lucky/random — decided client-side, indistinguishable on-chain),
///         encrypts them in one input, and funds all slots in one transaction.
///
/// A packet has ONE ephemeral signer key shared by a single QR / link. Anyone
/// holding the link claims the next free slot, first-come-first-served, at most
/// once per wallet (WeChat 红包 style). To claim, the claimer signs *their own
/// address* with the shared ephemeral key; the contract recovers the signer and
/// binds the payout to `msg.sender`. A mempool watcher who copies a pending
/// signature cannot redirect funds — the signed payload commits to the original
/// claimer's address (front-running resistant, single transaction).
contract RedPacketVault is ZamaEthereumConfig {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    uint256 public constant MAX_SLOTS = 50;

    ERC7984 public immutable token;
    AuditRegistry public immutable audit;

    struct Packet {
        address creator;
        uint32 count; // number of slots
        uint32 claimed; // slots claimed so far
        uint64 createdAt;
        bool exists;
        address auth; // single ephemeral signer shared by the packet's QR/link
        euint64 total; // encrypted sum of all slots
        string memo;
    }

    // packetId => packet
    mapping(uint256 => Packet) private _packets;
    // packetId => slot => encrypted amount
    mapping(uint256 => mapping(uint32 => euint64)) private _slotAmount;
    // packetId => slot => claimer address
    mapping(uint256 => mapping(uint32 => address)) public slotClaimer;
    // packetId => wallet => has already claimed
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    // packetId => wallet => slot index it claimed (valid only when hasClaimed)
    mapping(uint256 => mapping(address => uint32)) public claimedSlotOf;

    uint256 public nextPacketId = 1;

    event PacketCreated(uint256 indexed packetId, address indexed creator, uint32 count, string memo);
    event Claimed(uint256 indexed packetId, uint32 indexed slot, address indexed claimer);
    event AuditorGranted(uint256 indexed packetId, address indexed auditor);

    constructor(ERC7984 token_, AuditRegistry audit_) {
        token = token_;
        audit = audit_;
    }

    /// @notice Fund a red packet. Creator must have called `token.setOperator(vault, until)`
    ///         beforehand so the vault can pull the total.
    /// @param encAmounts One encrypted amount per slot (handles from a single SDK input).
    /// @param inputProof Shared input proof for all handles.
    /// @param auth Single ephemeral signer address shared by the packet's QR / link.
    /// @param memo Public label (no amount info), e.g. "Lunar New Year".
    function createPacket(
        externalEuint64[] calldata encAmounts,
        bytes calldata inputProof,
        address auth,
        string calldata memo
    ) external returns (uint256 packetId) {
        uint256 n = encAmounts.length;
        require(n > 0 && n <= MAX_SLOTS, "RP: bad slot count");
        require(auth != address(0), "RP: zero auth");

        packetId = nextPacketId++;

        euint64 sum = FHE.asEuint64(0);
        for (uint32 i = 0; i < n; i++) {
            euint64 amt = FHE.fromExternal(encAmounts[i], inputProof);
            FHE.allowThis(amt);
            _slotAmount[packetId][i] = amt;
            sum = FHE.add(sum, amt);
        }
        FHE.allowThis(sum);
        FHE.allowTransient(sum, address(token));

        // Batched confidential disperse: pull the encrypted total in one transfer.
        euint64 funded = token.confidentialTransferFrom(msg.sender, address(this), sum);
        FHE.allowThis(funded);
        FHE.allow(funded, msg.sender);

        _packets[packetId] = Packet({
            creator: msg.sender,
            count: uint32(n),
            claimed: 0,
            createdAt: uint64(block.timestamp),
            exists: true,
            auth: auth,
            total: funded,
            memo: memo
        });

        emit PacketCreated(packetId, msg.sender, uint32(n), memo);
    }

    /// @notice Claim the next free slot. `signature` = shared ephemeral-key signature
    ///         over the claimer's own address, binding the payout to `msg.sender`
    ///         (front-run resistant). One claim per wallet, first-come-first-served.
    function claim(uint256 packetId, bytes calldata signature) external returns (uint32 slot) {
        Packet storage p = _packets[packetId];
        require(p.exists, "RP: no packet");
        require(!hasClaimed[packetId][msg.sender], "RP: already claimed");
        require(p.claimed < p.count, "RP: empty");

        bytes32 digest = keccak256(abi.encodePacked(address(this), packetId, msg.sender)).toEthSignedMessageHash();
        address signer = digest.recover(signature);
        require(signer == p.auth, "RP: bad signature");

        slot = p.claimed;
        p.claimed = slot + 1;
        hasClaimed[packetId][msg.sender] = true;
        claimedSlotOf[packetId][msg.sender] = slot;
        slotClaimer[packetId][slot] = msg.sender;

        euint64 amt = _slotAmount[packetId][slot];
        FHE.allowTransient(amt, address(token));
        euint64 sent = token.confidentialTransfer(msg.sender, amt);
        FHE.allow(sent, msg.sender);

        emit Claimed(packetId, slot, msg.sender);
    }

    /// @notice Grant an auditor scoped decryption rights over this packet's totals
    ///         and per-slot amounts (selective disclosure). Creator only.
    function grantAuditor(uint256 packetId, address auditor) external {
        Packet storage p = _packets[packetId];
        require(p.exists, "RP: no packet");
        require(msg.sender == p.creator, "RP: not creator");
        require(auditor != address(0), "RP: zero auditor");

        FHE.allow(p.total, auditor);
        for (uint32 i = 0; i < p.count; i++) {
            FHE.allow(_slotAmount[packetId][i], auditor);
        }
        audit.recordGrant(address(this), packetId, auditor);
        emit AuditorGranted(packetId, auditor);
    }

    // ----- views -----

    function getPacket(
        uint256 packetId
    )
        external
        view
        returns (
            address creator,
            uint32 count,
            uint32 claimed,
            uint64 createdAt,
            address auth,
            euint64 total,
            string memory memo
        )
    {
        Packet storage p = _packets[packetId];
        require(p.exists, "RP: no packet");
        return (p.creator, p.count, p.claimed, p.createdAt, p.auth, p.total, p.memo);
    }

    function getSlotAmount(uint256 packetId, uint32 slot) external view returns (euint64) {
        return _slotAmount[packetId][slot];
    }

    /// @notice What a wallet got from a packet: whether it claimed, which slot, and
    ///         the encrypted amount handle (decryptable only by that wallet).
    function claimInfo(
        uint256 packetId,
        address wallet
    ) external view returns (bool claimed, uint32 slot, euint64 amount) {
        claimed = hasClaimed[packetId][wallet];
        slot = claimedSlotOf[packetId][wallet];
        amount = _slotAmount[packetId][slot];
    }
}
