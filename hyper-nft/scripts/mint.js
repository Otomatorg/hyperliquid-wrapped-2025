const hre = require("hardhat");

async function main() {
  const CONTRACT_ADDRESS = "0xYOUR_CONTRACT_ADDRESS"; // ← remplace-moi

  // Récupération du signer
  const [signer] = await hre.ethers.getSigners();
  console.log("Minting from:", signer.address);

  // Instanciation du contrat
  const nft = await hre.ethers.getContractAt("OnePerWalletNFT", CONTRACT_ADDRESS);

  // Appel du mint() free
  const tx = await nft.mint();
  console.log("Mint tx sent:", tx.hash);

  // Attendre la confirmation
  const receipt = await tx.wait();
  console.log("Mint confirmed in block:", receipt.blockNumber);

  // Récupérer le totalSupply après mint
  const totalSupply = await nft.totalSupply();
  console.log("Total Supply after mint:", totalSupply.toString());
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});