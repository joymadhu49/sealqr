// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import {AuditRegistry} from "./AuditRegistry.sol";

/// @title ConfidentialPay
/// @notice Pay-by-QR. A receiver shows a QR encoding {recipient, nonce, memo} — never
///         an amount. The payer scans, enters an amount locally, encrypts it, and sends
///         a confidential ERC-7984 transfer. The nonce is single-use per recipient, so a
///         request QR cannot be replayed. Amounts live encrypted on-chain; each party can
///         decrypt only their own view, and an auditor may be granted scoped access.
///
/// The payer must call `token.setOperator(pay, until)` once so this contract can move
/// funds on their behalf.
contract ConfidentialPay is ZamaEthereumConfig {
    ERC7984 public immutable token;
    AuditRegistry public immutable audit;

    struct Payment {
        address payer;
        address recipient;
        uint256 nonce;
        uint64 timestamp;
        euint64 amount;
        string memo;
    }

    mapping(uint256 => Payment) private _payments;
    // keccak(recipient, nonce) => used
    mapping(bytes32 => bool) public nonceUsed;
    uint256 public nextPaymentId = 1;

    event PaymentMade(
        uint256 indexed paymentId,
        address indexed payer,
        address indexed recipient,
        uint256 nonce,
        string memo
    );
    event AuditorGranted(uint256 indexed paymentId, address indexed auditor);

    constructor(ERC7984 token_, AuditRegistry audit_) {
        token = token_;
        audit = audit_;
    }

    function nonceKey(address recipient, uint256 nonce) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(recipient, nonce));
    }

    /// @notice Pay a scanned request. Amount is an encrypted input; nonce is consumed.
    function pay(
        address recipient,
        uint256 nonce,
        externalEuint64 encAmount,
        bytes calldata inputProof,
        string calldata memo
    ) external returns (uint256 paymentId) {
        require(recipient != address(0), "Pay: zero recipient");
        bytes32 k = nonceKey(recipient, nonce);
        require(!nonceUsed[k], "Pay: nonce used");
        nonceUsed[k] = true;

        euint64 amt = FHE.fromExternal(encAmount, inputProof);
        FHE.allowThis(amt);
        FHE.allowTransient(amt, address(token));
        euint64 sent = token.confidentialTransferFrom(msg.sender, recipient, amt);
        FHE.allowThis(sent);
        FHE.allow(sent, msg.sender);
        FHE.allow(sent, recipient);

        paymentId = nextPaymentId++;
        _payments[paymentId] = Payment({
            payer: msg.sender,
            recipient: recipient,
            nonce: nonce,
            timestamp: uint64(block.timestamp),
            amount: sent,
            memo: memo
        });

        emit PaymentMade(paymentId, msg.sender, recipient, nonce, memo);
    }

    /// @notice Grant an auditor scoped decryption rights over a payment amount.
    function grantAuditor(uint256 paymentId, address auditor) external {
        Payment storage p = _payments[paymentId];
        require(p.payer != address(0), "Pay: no payment");
        require(msg.sender == p.payer || msg.sender == p.recipient, "Pay: not party");
        require(auditor != address(0), "Pay: zero auditor");
        FHE.allow(p.amount, auditor);
        audit.recordGrant(address(this), paymentId, auditor);
        emit AuditorGranted(paymentId, auditor);
    }

    function getPayment(
        uint256 paymentId
    )
        external
        view
        returns (address payer, address recipient, uint256 nonce, uint64 timestamp, euint64 amount, string memory memo)
    {
        Payment storage p = _payments[paymentId];
        require(p.payer != address(0), "Pay: no payment");
        return (p.payer, p.recipient, p.nonce, p.timestamp, p.amount, p.memo);
    }
}
