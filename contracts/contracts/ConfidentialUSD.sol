// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/// @title ConfidentialUSD (cUSD)
/// @notice ERC-7984 confidential stablecoin used by SealQR. Balances and transfer
///         amounts are encrypted (euint64). Includes a demo faucet so anyone can
///         obtain test funds on Sepolia.
/// @dev Units use 6 decimals (1 cUSD = 1_000_000). Do NOT use in production.
contract ConfidentialUSD is ZamaEthereumConfig, ERC7984, Ownable2Step {
    /// @notice Fixed amount minted per faucet call (100 cUSD).
    uint64 public constant FAUCET_AMOUNT = 100_000_000;
    /// @notice Cooldown between faucet claims per address.
    uint64 public constant FAUCET_COOLDOWN = 1 hours;

    mapping(address => uint256) public lastFaucet;

    event FaucetClaimed(address indexed to);

    constructor(
        address owner_
    ) ERC7984("Confidential USD", "cUSD", "https://sealqr.app/token/cusd") Ownable(owner_) {}

    /// @notice Mint a fixed clear amount of test tokens to the caller.
    /// @dev Clear amount is acceptable here — it is a demo faucet, not a transfer.
    function faucet() external {
        require(block.timestamp >= lastFaucet[msg.sender] + FAUCET_COOLDOWN, "cUSD: faucet cooldown");
        lastFaucet[msg.sender] = block.timestamp;
        _mint(msg.sender, FHE.asEuint64(FAUCET_AMOUNT));
        emit FaucetClaimed(msg.sender);
    }

    /// @notice Owner mint of an encrypted amount (confidential issuance).
    function confidentialMint(
        address to,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external onlyOwner returns (euint64 transferred) {
        transferred = FHE.fromExternal(encryptedAmount, inputProof);
        _mint(to, transferred);
    }

    /// @notice Owner mint of a clear amount (for seeding demos).
    function mint(address to, uint64 amount) external onlyOwner {
        _mint(to, FHE.asEuint64(amount));
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}
