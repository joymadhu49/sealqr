import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { HDNodeWallet, Signer } from "ethers";

const FAUCET = 100_000_000n; // 100 cUSD (6 decimals)

describe("SealQR", function () {
  let deployer: Signer, alice: Signer, bob: Signer, carol: Signer, auditor: Signer;
  let cusd: any, audit: any, vault: any, pay: any;
  let cusdAddr: string, vaultAddr: string, payAddr: string;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    [deployer, alice, bob, carol, auditor] = await ethers.getSigners();

    const CUSD = await ethers.getContractFactory("ConfidentialUSD");
    cusd = await CUSD.deploy(await deployer.getAddress());
    cusdAddr = await cusd.getAddress();

    const Audit = await ethers.getContractFactory("AuditRegistry");
    audit = await Audit.deploy();

    const Vault = await ethers.getContractFactory("RedPacketVault");
    vault = await Vault.deploy(cusdAddr, await audit.getAddress());
    vaultAddr = await vault.getAddress();

    const Pay = await ethers.getContractFactory("ConfidentialPay");
    pay = await Pay.deploy(cusdAddr, await audit.getAddress());
    payAddr = await pay.getAddress();
  });

  async function fund(signer: Signer) {
    await (await cusd.connect(signer).faucet()).wait();
  }

  async function balanceOf(signer: Signer): Promise<bigint> {
    const addr = await signer.getAddress();
    const handle = await cusd.confidentialBalanceOf(addr);
    return fhevm.userDecryptEuint(FhevmType.euint64, handle, cusdAddr, signer);
  }

  it("faucet mints encrypted balance the holder can decrypt", async () => {
    await fund(alice);
    expect(await balanceOf(alice)).to.equal(FAUCET);
  });

  // Sign the claim digest with the packet's single shared ephemeral key, bound to
  // the claimer's own address: keccak(vault, packetId, claimer).ethSignedMessageHash.
  async function signClaim(eph: HDNodeWallet, packetId: bigint, claimer: string) {
    const digest = ethers.solidityPackedKeccak256(["address", "uint256", "address"], [vaultAddr, packetId, claimer]);
    return eph.signMessage(ethers.getBytes(digest));
  }

  it("one shared link: claimers grab the next free slot, one per wallet, front-run resistant", async () => {
    await fund(alice);

    // Alice authorises the vault as operator so it can pull the total.
    const until = Math.floor(Date.now() / 1000) + 3600;
    await (await cusd.connect(alice).setOperator(vaultAddr, until)).wait();

    // Two slots: lucky split 30 + 70 = 100 cUSD. Encrypted in one input. One shared key.
    const a0 = 30_000_000n;
    const a1 = 70_000_000n;
    const eph = ethers.Wallet.createRandom();

    const enc = await fhevm
      .createEncryptedInput(vaultAddr, await alice.getAddress())
      .add64(a0)
      .add64(a1)
      .encrypt();

    await (
      await vault.connect(alice).createPacket([enc.handles[0], enc.handles[1]], enc.inputProof, eph.address, "Test packet")
    ).wait();
    const packetId = 1n;

    const bobAddr = await bob.getAddress();
    const carolAddr = await carol.getAddress();

    // Bob claims first → gets slot 0.
    await (await vault.connect(bob).claim(packetId, await signClaim(eph, packetId, bobAddr))).wait();
    expect(await balanceOf(bob)).to.equal(a0);
    expect(await vault.claimedSlotOf(packetId, bobAddr)).to.equal(0);

    // Front-run resistance: a watcher (carol) replaying Bob's signature is rejected —
    // the signature commits to Bob's address, not carol's.
    const bobSig = await signClaim(eph, packetId, bobAddr);
    await expect(vault.connect(carol).claim(packetId, bobSig)).to.be.revertedWith("RP: bad signature");

    // Carol claims correctly → gets slot 1.
    await (await vault.connect(carol).claim(packetId, await signClaim(eph, packetId, carolAddr))).wait();
    expect(await balanceOf(carol)).to.equal(a1);

    // One claim per wallet.
    await expect(vault.connect(bob).claim(packetId, await signClaim(eph, packetId, bobAddr))).to.be.revertedWith(
      "RP: already claimed",
    );

    // Packet now empty.
    await expect(vault.connect(deployer).claim(packetId, await signClaim(eph, packetId, await deployer.getAddress())))
      .to.be.revertedWith("RP: empty");
  });

  it("auditor can decrypt packet total after a scoped grant", async () => {
    await fund(alice);
    const until = Math.floor(Date.now() / 1000) + 3600;
    await (await cusd.connect(alice).setOperator(vaultAddr, until)).wait();

    const eph = ethers.Wallet.createRandom();
    const enc = await fhevm.createEncryptedInput(vaultAddr, await alice.getAddress()).add64(50_000_000n).encrypt();
    await (await vault.connect(alice).createPacket([enc.handles[0]], enc.inputProof, eph.address, "Audit")).wait();

    await (await vault.connect(alice).grantAuditor(1n, await auditor.getAddress())).wait();

    const total = (await vault.getPacket(1n)).total;
    const clear = await fhevm.userDecryptEuint(FhevmType.euint64, total, vaultAddr, auditor);
    expect(clear).to.equal(50_000_000n);
  });

  it("pay-by-QR: confidential transfer with one-time nonce", async () => {
    await fund(alice);
    const until = Math.floor(Date.now() / 1000) + 3600;
    await (await cusd.connect(alice).setOperator(payAddr, until)).wait();

    const nonce = 42n;
    const amount = 25_000_000n;
    const enc = await fhevm.createEncryptedInput(payAddr, await alice.getAddress()).add64(amount).encrypt();

    await (
      await pay.connect(alice).pay(await bob.getAddress(), nonce, enc.handles[0], enc.inputProof, "Lunch")
    ).wait();

    expect(await balanceOf(bob)).to.equal(amount);

    // Nonce cannot be replayed.
    const enc2 = await fhevm.createEncryptedInput(payAddr, await alice.getAddress()).add64(amount).encrypt();
    await expect(
      pay.connect(alice).pay(await bob.getAddress(), nonce, enc2.handles[0], enc2.inputProof, "Lunch"),
    ).to.be.revertedWith("Pay: nonce used");
  });
});
