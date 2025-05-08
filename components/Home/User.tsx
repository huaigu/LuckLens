import { useMiniAppContext } from "@/hooks/use-miniapp-context";

export function User() {
  const { context } = useMiniAppContext();

  return (
    <div className="w-full space-y-4 border-4 border-[#ffe066] rounded-none p-4 bg-[#181c24] shadow-[4px_4px_0_0_#333] break-words whitespace-normal">
      <h2 className="text-base font-bold text-left text-[#ffe066] tracking-widest uppercase drop-shadow-[2px_2px_0_#333]">SDK.CONTEXT</h2>
      <div className="flex flex-row space-x-4 justify-start items-start">
        {context?.user ? (
          <>
            {context?.user?.pfpUrl && (
              <img
                src={context?.user?.pfpUrl}
                className="w-14 h-14 rounded-none border-4 border-[#333] bg-[#ffe066] shadow-[2px_2px_0_#333]"
                alt="User Profile Picture"
                width={56}
                height={56}
              />
            )}
            <div className="flex flex-col justify-start items-start space-y-2">
              <p className="text-xs text-left text-[#f5e9d6] uppercase">
                USER.DISPLAYNAME: {" "}
                <span className="bg-[#ffe066] font-mono text-black rounded-none p-[4px] border-2 border-[#333] shadow-[2px_2px_0_#333] break-all">
                  {context?.user?.displayName}
                </span>
              </p>
              <p className="text-xs text-left text-[#f5e9d6] uppercase">
                USER.USERNAME: {" "}
                <span className="bg-[#ffe066] font-mono text-black rounded-none p-[4px] border-2 border-[#333] shadow-[2px_2px_0_#333] break-all">
                  {context?.user?.username}
                </span>
              </p>
              <p className="text-xs text-left text-[#f5e9d6] uppercase">
                USER.FID: {" "}
                <span className="bg-[#ffe066] font-mono text-black rounded-none p-[4px] border-2 border-[#333] shadow-[2px_2px_0_#333] break-all">
                  {context?.user?.fid}
                </span>
              </p>
            </div>
          </>
        ) : (
          <p className="text-xs text-left text-[#f5e9d6] uppercase break-words whitespace-normal">USER CONTEXT NOT AVAILABLE</p>
        )}
      </div>
    </div>
  );
}
