For Pender, I identified those events and I basically fetched all the logs for those events for the Pender router:
```json
export const PENDLE_EVENTS = [
  {
    type: "event",
    name: "SwapPtAndToken",
    inputs: [
      { indexed: true,  name: "caller",              type: "address" },
      { indexed: true,  name: "market",              type: "address" },
      { indexed: true,  name: "token",               type: "address" },
      { indexed: false, name: "receiver",            type: "address" },
      { indexed: false, name: "netPtToAccount",      type: "int256"  },
      { indexed: false, name: "netTokenToAccount",   type: "int256"  },
      { indexed: false, name: "netSyInterm",         type: "uint256" }
    ]
  },

  {
    type: "event",
    name: "ExitPostExpToToken",
    inputs: [
      { indexed: true,  name: "caller",            type: "address" },
      { indexed: true,  name: "market",            type: "address" },
      { indexed: true,  name: "token",             type: "address" },
      { indexed: false, name: "receiver",          type: "address" },
      { indexed: false, name: "netLpIn",           type: "uint256" },
      { indexed: false, name: "totalTokenOut",     type: "uint256" },
      { indexed: false, name: "params",            type: "tuple"    }
    ]
  },

  {
    type: "event",
    name: "SwapYtAndToken",
    inputs: [
      { indexed: true,  name: "caller",              type: "address" },
      { indexed: true,  name: "market",              type: "address" },
      { indexed: true,  name: "token",               type: "address" },
      { indexed: false, name: "receiver",            type: "address" },
      { indexed: false, name: "netYtToAccount",      type: "int256"  },
      { indexed: false, name: "netTokenToAccount",   type: "int256"  },
      { indexed: false, name: "netSyInterm",         type: "uint256" }
    ]
  },

  {
    type: "event",
    name: "RemoveLiquiditySingleToken",
    inputs: [
      { indexed: true,  name: "caller",        type: "address" },
      { indexed: true,  name: "market",        type: "address" },
      { indexed: true,  name: "token",         type: "address" },
      { indexed: false, name: "receiver",      type: "address" },
      { indexed: false, name: "netLpToRemove", type: "uint256" },
      { indexed: false, name: "netTokenOut",   type: "uint256" },
      { indexed: false, name: "netSyInterm",   type: "uint256" }
    ]
  },

  {
    type: "event",
    name: "AddLiquiditySingleToken",
    inputs: [
      { indexed: true,  name: "caller",      type: "address" },
      { indexed: true,  name: "market",      type: "address" },
      { indexed: true,  name: "token",       type: "address" },
      { indexed: false, name: "receiver",    type: "address" },
      { indexed: false, name: "netTokenIn",  type: "uint256" },
      { indexed: false, name: "netLpOut",    type: "uint256" },
      { indexed: false, name: "netSyInterm", type: "uint256" }
    ]
  },

  {
    type: "event",
    name: "AddLiquiditySingleSyKeepYt",
    inputs: [
      { indexed: true,  name: "caller",      type: "address" },
      { indexed: true,  name: "market",      type: "address" },
      { indexed: true,  name: "receiver",    type: "address" },
      { indexed: false, name: "netSyIn",     type: "uint256" },
      { indexed: false, name: "netSyMintPy", type: "uint256" },
      { indexed: false, name: "netLpOut",    type: "uint256" },
      { indexed: false, name: "netYtOut",    type: "uint256" }
    ]
  },

  {
    type: "event",
    name: "RemoveLiquiditySingleSy",
    inputs: [
      { indexed: true,  name: "caller",        type: "address" },
      { indexed: true,  name: "market",        type: "address" },
      { indexed: true,  name: "receiver",      type: "address" },
      { indexed: false, name: "netLpToRemove", type: "uint256" },
      { indexed: false, name: "netSyOut",      type: "uint256" }
    ]
  },

  {
    type: "event",
    name: "RedeemPyToToken",
    inputs: [
      { indexed: true,  name: "caller",      type: "address" },
      { indexed: true,  name: "tokenOut",    type: "address" },
      { indexed: true,  name: "YT",          type: "address" },
      { indexed: false, name: "receiver",    type: "address" },
      { indexed: false, name: "netPyIn",     type: "uint256" },
      { indexed: false, name: "netTokenOut", type: "uint256" },
      { indexed: false, name: "netSyInterm", type: "uint256" }
    ]
  }
];
```