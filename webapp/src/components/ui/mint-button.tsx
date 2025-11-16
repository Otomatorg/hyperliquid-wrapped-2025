import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useEffect, useState } from 'react';

// Your NFT smart contract details
const CONTRACT_ADDRESS = "0xcae54d9b8ebd840a9d37401958c826dfd41af759";
const CONTRACT_ABI = [
  {
    name: "mint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  }
];

interface MintButtonProps {
  disabled?: boolean;
}

export function MintButton({ disabled = false }: MintButtonProps) {
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useAccount();

  const {
    data: hash,
    isPending,
    writeContract,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleMint() {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "mint",
    });
  }

  // Prevent hydration mismatch by only rendering after mount
  if (!mounted) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-36 h-12 rounded-full !bg-cyan-50d border border-rgba255-300 text-white font-medium flex items-center justify-center overflow-hidden whitespace-nowrap">
          <div className="w-full h-full flex items-center justify-center">Connect</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* RainbowKit connect button */}
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          const ready = mounted && authenticationStatus !== 'loading';
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus ||
              authenticationStatus === 'authenticated');

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                'style': {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <button
                      onClick={openConnectModal}
                      type="button"
                      disabled={disabled}
                      className="w-36 h-12 rounded-full !bg-cyan-50d border border-rgba255-300 hover:bg-cyan-50d focus:bg-cyan-50d active:bg-gradient-to-tr active:from-cyan-50d active:to-cyan-50d disabled:bg-rgba80-210-193-170 text-white font-medium flex items-center justify-center overflow-hidden whitespace-nowrap"
                    >
                     {disabled ? "Share on X to Mint" : "Mint"}
                    </button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button onClick={openChainModal} type="button" className="w-36 h-12 rounded-full !bg-cyan-50d border border-rgba255-300 hover:bg-cyan-50d focus:bg-cyan-50d active:bg-gradient-to-tr active:from-cyan-50d active:to-cyan-50d disabled:bg-rgba80-210-193-170 text-white font-medium flex items-center justify-center overflow-hidden whitespace-nowrap">
                      Wrong network
                    </button>
                  );
                }

                return (
                  <button onClick={openAccountModal} type="button" className="w-36 h-12 rounded-full !bg-cyan-50d border border-rgba255-300 hover:bg-cyan-50d focus:bg-cyan-50d active:bg-gradient-to-tr active:from-cyan-50d active:to-cyan-50d disabled:bg-rgba80-210-193-170 text-white font-medium flex items-center justify-center overflow-hidden whitespace-nowrap">
                    {account.displayName}
                  </button>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>


      {/* Only show if user is connected */}
      {isConnected && (
        <button
          onClick={handleMint}
          disabled={disabled || isPending || isConfirming}
          className="w-36 h-12 rounded-full !bg-cyan-50d border border-rgba255-300 hover:bg-cyan-50d focus:bg-cyan-50d active:bg-gradient-to-tr active:from-cyan-50d active:to-cyan-50d disabled:bg-rgba80-210-193-170 disabled:cursor-not-allowed text-white font-medium overflow-hidden whitespace-nowrap text-ellipsis"
          title={disabled ? "Please share on X first" : undefined}
        >
          {disabled ? "Share on X to Mint" : isPending
            ? "Minting..."
            : isConfirming
              ? "Confirming..."
              : isSuccess && hash ? `Mint successful!` : "Mint"}
        </button>
      )}

    </div>
  );
}
