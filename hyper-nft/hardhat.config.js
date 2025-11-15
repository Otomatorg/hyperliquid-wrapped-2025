require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

module.exports = {
  solidity: "0.8.20",
  networks: {
    hyperEvmTestnet: {
      url: "https://rpcs.chain.link/hyperevm/testnet", // HyperEVM testnet RPC
      chainId: 998,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    },
    hyperEvmMainnet: {
      url: "https://rpc.hyperliquid.xyz/evm", // HyperEVM mainnet RPC
      chainId: 999,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    },
    sepoliaTestnet: {
      url: "https://ethereum-sepolia.rpc.subquery.network/public", // Hoodi testnet RPC
      chainId: 11155111,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    }
  }
};