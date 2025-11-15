require("dotenv").config();
const { ethers } = require("ethers");
const path = require("path");
const fs = require("fs");

// ⚠️ remplace par l'adresse de ton contrat déployé
const CONTRACT_ADDRESS = "0xCAe54d9b8EbD840A9d37401958c826Dfd41af759";

// Même RPC que dans ton hardhat.config.js
const RPC_URL = "https://rpc.hyperliquid.xyz/evm"; // ou ton URL RPC hyperEvmTestnet

async function main() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error("Missing PRIVATE_KEY in .env");
  }

  // Charger l'ABI compilée par Hardhat
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "OnePerWalletNFT.sol",
    "OnePerWalletNFT.json"
  );
  const artifactJson = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abi = artifactJson.abi;

  // Provider + wallet (ethers “pur”, sans Hardhat)
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("Minting from:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "HYPE");

  // Instancier le contrat
  const nft = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

  console.log("Calling mint()...");
  const tx = await nft.mint(); // free mint
  console.log("Tx sent:", tx.hash);

  const receipt = await tx.wait();
  console.log("Mint confirmed in block:", receipt.blockNumber);

  const totalSupply = await nft.totalSupply();
  console.log("Total supply after mint:", totalSupply.toString());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});