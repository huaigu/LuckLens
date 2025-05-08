import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { APP_URL } from "@/lib/constants";

export function FarcasterActions() {
  const { actions } = useMiniAppContext();

  return (
    <div className="w-full space-y-4 border-4 border-purple-600 rounded-none p-4 bg-[#181c24] shadow-[4px_4px_0_0_#333] break-words whitespace-normal">
      <h2 className="text-base font-bold text-left text-purple-400 tracking-widest uppercase drop-shadow-[2px_2px_0_#333]">SDK.ACTIONS</h2>
      <div className="flex flex-row space-x-4 justify-start items-start">
        {actions ? (
          <div className="flex flex-col space-y-4 justify-start">
            <button
              className="bg-[#ffe066] text-black rounded-none p-2 text-xs font-bold border-2 border-[#333] shadow-[2px_2px_0_#333] uppercase hover:bg-yellow-300 transition break-words whitespace-normal"
              onClick={() => actions?.addFrame()}
            >
              ADD FRAME
            </button>
            <button
              className="bg-[#ffe066] text-black rounded-none p-2 text-xs font-bold border-2 border-[#333] shadow-[2px_2px_0_#333] uppercase hover:bg-yellow-300 transition break-words whitespace-normal"
              onClick={() => actions?.close()}
            >
              CLOSE
            </button>
            <button
              className="bg-[#ffe066] text-black rounded-none p-2 text-xs font-bold border-2 border-[#333] shadow-[2px_2px_0_#333] uppercase hover:bg-yellow-300 transition break-words whitespace-normal"
              onClick={() =>
                actions?.composeCast({
                  text: "Check out this Monad Farcaster MiniApp Template!",
                  embeds: [`${APP_URL}`],
                })
              }
            >
              COMPOSE CAST
            </button>
            <button
              className="bg-[#ffe066] text-black rounded-none p-2 text-xs font-bold border-2 border-[#333] shadow-[2px_2px_0_#333] uppercase hover:bg-yellow-300 transition break-words whitespace-normal"
              onClick={() => actions?.openUrl("https://docs.monad.xyz")}
            >
              OPEN URL
            </button>
            <button
              className="bg-[#ffe066] text-black rounded-none p-2 text-xs font-bold border-2 border-[#333] shadow-[2px_2px_0_#333] uppercase hover:bg-yellow-300 transition break-words whitespace-normal"
              onClick={() => actions?.signIn({ nonce: "1201" })}
            >
              SIGN IN
            </button>
            <button
              className="bg-[#ffe066] text-black rounded-none p-2 text-xs font-bold border-2 border-[#333] shadow-[2px_2px_0_#333] uppercase hover:bg-yellow-300 transition break-words whitespace-normal"
              onClick={() => actions?.viewProfile({ fid: 17979 })}
            >
              VIEW PROFILE
            </button>
          </div>
        ) : (
          <p className="text-xs text-left text-[#f5e9d6] uppercase break-words whitespace-normal">ACTIONS NOT AVAILABLE</p>
        )}
      </div>
    </div>
  );
}
