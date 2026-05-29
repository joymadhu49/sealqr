// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title AuditRegistry
/// @notice Transparent ledger of selective-disclosure grants. The actual decryption
///         rights are granted on-chain via `FHE.allow(handle, auditor)` inside the
///         source contract (RedPacketVault / ConfidentialPay); this registry records
///         *that* a grant happened so an auditor's app can enumerate what it may view.
///         It never stores amounts — only who was granted access to what.
contract AuditRegistry {
    struct Grant {
        address source; // contract that granted (vault / pay)
        uint256 refId; // packetId or paymentId
        address grantedBy; // creator / payer
        uint64 timestamp;
    }

    // auditor => grants visible to them
    mapping(address => Grant[]) private _grantsFor;

    event GrantRecorded(address indexed auditor, address indexed source, uint256 indexed refId, address grantedBy);

    /// @notice Called by a source contract when it grants an auditor decryption rights.
    function recordGrant(address source, uint256 refId, address auditor) external {
        // msg.sender is the source contract performing the FHE.allow.
        _grantsFor[auditor].push(
            Grant({source: msg.sender, refId: refId, grantedBy: tx.origin, timestamp: uint64(block.timestamp)})
        );
        emit GrantRecorded(auditor, msg.sender, refId, tx.origin);
        // `source` arg kept for forward-compat / explicit logging by caller.
        source;
    }

    function grantsFor(address auditor) external view returns (Grant[] memory) {
        return _grantsFor[auditor];
    }

    function grantCount(address auditor) external view returns (uint256) {
        return _grantsFor[auditor].length;
    }
}
