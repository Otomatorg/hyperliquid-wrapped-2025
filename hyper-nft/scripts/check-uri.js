const { ethers } = require("ethers");

async function main() {
  const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia.rpc.subquery.network/public"); // or Alchemy
  const nft = new ethers.Contract(
    "0x522f9D63921a7b263B753AA530e9Bfd37E4fD15a",
    ["function tokenURI(uint256) view returns (string)"],
    provider
  );

  console.log(await nft.tokenURI(1));
}

main();