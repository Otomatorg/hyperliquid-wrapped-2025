require("dotenv").config();
const { ethers } = require("ethers");

// -------------------------------------
// CONFIG — CHANGE THESE
// -------------------------------------

// HyperEVM testnet or mainnet RPC
const RPC_URL = "https://ethereum-sepolia.rpc.subquery.network/public";   

// Your deployed NFT contract address
const CONTRACT_ADDRESS = "0xB4107e5c515488a3Ad4a5F65688b768DC50dEAFe";

// Your new metadata URI on IPFS
const NEW_METADATA_URI = "ipfs://bafkreidlnkiatq5pkz7iesug6nodnnrobyozr7qtekm4c6buj3lam46o7i";      

// -------------------------------------

async function main() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error("❌ Missing PRIVATE_KEY in .env");
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("Using wallet:", wallet.address);

  // Minimal ABI for calling the function
  const abi = [
    "function setCommonTokenURI(string newURI) external",
  ];

  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

  console.log("Updating tokenURI to:", NEW_METADATA_URI);

  const tx = await contract.setCommonTokenURI(NEW_METADATA_URI);
  console.log("Tx sent:", tx.hash);

  const receipt = await tx.wait();
  console.log("✔️ Transaction confirmed in block:", receipt.blockNumber);

  console.log("🎉 Common metadata URI successfully updated!");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});