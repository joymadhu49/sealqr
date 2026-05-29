import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys the full SealQR stack:
 *   ConfidentialUSD (cUSD)  -> ERC-7984 confidential test stablecoin + faucet
 *   AuditRegistry           -> selective-disclosure grant ledger
 *   RedPacketVault          -> confidential red packets (batched disperse)
 *   ConfidentialPay         -> pay-by-QR confidential transfers
 *
 * After deploy, addresses are written to deployments/<network>/ by hardhat-deploy,
 * and a frontend-friendly JSON is emitted to ../frontend/lib/contracts/addresses.<chainId>.json
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const cusd = await deploy("ConfidentialUSD", {
    from: deployer,
    args: [deployer],
    log: true,
  });

  const audit = await deploy("AuditRegistry", {
    from: deployer,
    args: [],
    log: true,
  });

  const vault = await deploy("RedPacketVault", {
    from: deployer,
    args: [cusd.address, audit.address],
    log: true,
  });

  const pay = await deploy("ConfidentialPay", {
    from: deployer,
    args: [cusd.address, audit.address],
    log: true,
  });

  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  const out = {
    chainId,
    ConfidentialUSD: cusd.address,
    AuditRegistry: audit.address,
    RedPacketVault: vault.address,
    ConfidentialPay: pay.address,
  };

  const fs = await import("fs");
  const path = await import("path");
  const dir = path.resolve(__dirname, "../../frontend/lib/contracts");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `addresses.${chainId}.json`), JSON.stringify(out, null, 2));
  log(`\nSealQR deployed on chain ${chainId}:`);
  log(JSON.stringify(out, null, 2));
};

export default func;
func.tags = ["SealQR"];
