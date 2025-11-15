const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deployer:", deployer.address);
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Deployer balance:", hre.ethers.formatEther(balance), "HYPE");

  const name = "Otomato x Hyperliquid";
  const symbol = "OTOMATOXHYPERLIQUID";
  const baseTokenURI = "ipfs://bafkreie3oryhjsbguikibeu2msa6ot3xmcwmfgaln2fiyfzb5mfvklaj7i"; // à adapter

  const NFT = await hre.ethers.getContractFactory("OnePerWalletNFT");
  const nft = await NFT.deploy(name, symbol, baseTokenURI);

  // ✅ Ethers v6 style
  await nft.waitForDeployment();

  const addr = await nft.getAddress();
  console.log("OnePerWalletNFT deployed to:", addr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});