import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { parseEther } from "viem";
import { monadTestnet } from "viem/chains";
import {
  useAccount,
  useDisconnect,
  useSendTransaction,
  useSwitchChain,
} from "wagmi";

export function WalletActions() {
  const { isEthProviderAvailable } = useMiniAppContext();
  const { isConnected, address, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: hash, sendTransaction } = useSendTransaction();
  const { switchChain } = useSwitchChain();

  async function sendTransactionHandler() {
    sendTransaction({
      to: "0x7f748f154B6D180D35fA12460C7E4C631e28A9d7",
      value: parseEther("1"),
    });
  }

  return (
    <div className="w-full space-y-4 border-4 border-yellow-400 rounded-none p-4 bg-[#181c24] shadow-[4px_4px_0_0_#333] break-words whitespace-normal">
      <h2 className="text-base font-bold text-left text-yellow-400 tracking-widest uppercase drop-shadow-[2px_2px_0_#333]">SDK.WALLET.ETHPROVIDER</h2>
      <div className="flex flex-row space-x-4 justify-start items-start">
        {isConnected ? (
          <div className="flex flex-col space-y-4 justify-start">
            <p className="text-xs text-left text-[#f5e9d6] uppercase">
              Connected to wallet: {" "}
              <span className="bg-[#ffe066] font-mono text-black rounded-none p-[4px] border-2 border-[#333] shadow-[2px_2px_0_#333] break-all">
                {address}
              </span>
            </p>
            <p className="text-xs text-left text-[#f5e9d6] uppercase">
              Chain Id: {" "}
              <span className="bg-[#ffe066] font-mono text-black rounded-none p-[4px] border-2 border-[#333] shadow-[2px_2px_0_#333] break-all">
                {chainId}
              </span>
            </p>
            {chainId === monadTestnet.id ? (
              <div className="flex flex-col space-y-2 border-4 border-purple-600 p-4 rounded-none bg-[#23243a] shadow-[4px_4px_0_0_#333] break-words whitespace-normal">
                <h2 className="text-base font-bold text-left text-purple-400 tracking-widest uppercase drop-shadow-[2px_2px_0_#333]">SEND TRANSACTION EXAMPLE</h2>
                <button
                  className="bg-[#ffe066] text-black rounded-none p-2 text-xs font-bold border-2 border-[#333] shadow-[2px_2px_0_#333] uppercase hover:bg-yellow-300 transition break-words whitespace-normal"
                  onClick={sendTransactionHandler}
                >
                  SEND TRANSACTION
                </button>
                {hash && (
                  <button
                    className="bg-[#ffe066] text-black rounded-none p-2 text-xs font-bold border-2 border-[#333] shadow-[2px_2px_0_#333] uppercase hover:bg-yellow-300 transition break-words whitespace-normal"
                    onClick={() =>
                      window.open(
                        `https://testnet.monadexplorer.com/tx/${hash}`,
                        "_blank"
                      )
                    }
                  >
                    VIEW TRANSACTION
                  </button>
                )}
              </div>
            ) : (
              <button
                className="bg-[#ffe066] text-black rounded-none p-2 text-xs font-bold border-2 border-[#333] shadow-[2px_2px_0_#333] uppercase hover:bg-yellow-300 transition break-words whitespace-normal"
                onClick={() => switchChain({ chainId: monadTestnet.id })}
              >
                SWITCH TO MONAD TESTNET
              </button>
            )}

            <button
              className="bg-red-500 text-white rounded-none p-2 text-xs font-bold border-2 border-[#333] shadow-[2px_2px_0_#333] uppercase hover:bg-red-400 transition break-words whitespace-normal"
              onClick={() => disconnect()}
            >
              DISCONNECT WALLET
            </button>
          </div>
        ) : (
          !isEthProviderAvailable && (
            <p className="text-xs text-left text-[#f5e9d6] uppercase break-words whitespace-normal">
              WALLET CONNECTION ONLY VIA WARPCAST
            </p>
          )
        )}
      </div>
    </div>
  );
}
