"use client";
import { useState, useEffect, useRef } from "react";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { useAccount, useSwitchChain, useSendTransaction } from "wagmi";
import { parseEther, encodeFunctionData } from "viem";
import { monadTestnet } from "viem/chains";
import { generateFortuneContent, getCachedFortuneContent, type GeneratedContent } from "@/lib/fortune-generator";

const MAX_DRAW_COUNT = 3;

// Static arrays replaced with AI-generated content
// See lib/fortune-generator.ts for fallback content and generation logic

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getLuckStorageKey(address: string, date: string) {
  return `cyberluck_result_${address}_${date}`;
}

const CONTRACT_ADDRESS = "0xACf06C4C2A80883535DDE647DeC499EAd80bD881";
const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "mint",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

export default function CyberLuck() {
  const [luckIdx, setLuckIdx] = useState<number | null>(null);
  const [proverbIdx, setProverbIdx] = useState<number | null>(null);
  const { actions } = useMiniAppContext();
  const { address, chainId, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const { data: txHash, isPending: isMinting, isError, error, isSuccess } = useSendTransaction();
  const { sendTransactionAsync } = useSendTransaction();
  const [txSent, setTxSent] = useState(false);

  // AI-generated content state
  const [fortuneContent, setFortuneContent] = useState<GeneratedContent | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // 抽签动画状态
  const [isDrawing, setIsDrawing] = useState(false);
  const [animatingStick, setAnimatingStick] = useState(-1);

  // 新增：抽签次数和提示
  const [drawCount, setDrawCount] = useState(0);
  const [drawTip, setDrawTip] = useState("");

  // 新增：mint 状态
  const [mintTip, setMintTip] = useState("");

  const [animationDone, setAnimationDone] = useState(false);
  const stickTimer = useRef<NodeJS.Timeout | null>(null);
  const finalIdx = useRef(0);

  const [isWarpcast, setIsWarpcast] = useState(true);

  // Initialize with cached content, generate fresh content on draw
  useEffect(() => {
    const initializeContent = async () => {
      setIsLoadingContent(true);
      try {
        // Start with cached content for immediate display
        const cachedContent = getCachedFortuneContent();
        setFortuneContent(cachedContent);
      } catch (error) {
        console.error('Failed to initialize fortune content:', error);
        // Use fallback content
        setFortuneContent(getCachedFortuneContent());
      } finally {
        setIsLoadingContent(false);
      }
    };

    initializeContent();
  }, []);

  useEffect(() => {
    // 检测是否在 Warpcast 内嵌
    let inside = true;
    try {
      // 如果不是 iframe 或 userAgent 不包含 Warpcast
      inside = window.parent !== window || /Warpcast/i.test(navigator.userAgent);
    } catch {
      inside = false;
    }
    setIsWarpcast(inside);
  }, []);

  // 页面加载时读取本地抽签结果
  useEffect(() => {
    if (!address) {
      setLuckIdx(null);
      setProverbIdx(null);
      return;
    }
    const today = getTodayStr();
    const resultKey = getLuckStorageKey(address, today);
    const resultStr = localStorage.getItem(resultKey);
    if (resultStr) {
      try {
        const { luckIdx: l, proverbIdx: p, date } = JSON.parse(resultStr);
        if (date === today && typeof l === 'number' && typeof p === 'number') {
          setLuckIdx(l);
          setProverbIdx(p);
        } else {
          setLuckIdx(null);
          setProverbIdx(null);
        }
      } catch {
        setLuckIdx(null);
        setProverbIdx(null);
      }
    } else {
      setLuckIdx(null);
      setProverbIdx(null);
    }
  }, [address]);

  // 动画和链上确认同步开奖
  useEffect(() => {
    if (!isDrawing || !txSent) return;
    if (animationDone) {
      if (stickTimer.current) clearInterval(stickTimer.current);

      // Since we now generate single fortune and proverb per API call,
      // we always use index 0 for both
      const lidx = 0;
      const pidx = 0;

      setLuckIdx(lidx);
      setProverbIdx(pidx);
      if (address) {
        const today = getTodayStr();
        const resultKey = getLuckStorageKey(address, today);
        localStorage.setItem(resultKey, JSON.stringify({ luckIdx: lidx, proverbIdx: pidx, date: today }));
        const key = `cyberluck_draw_count_${address}_${today}`;
        const newCount = drawCount + 1;
        localStorage.setItem(key, String(newCount));
        setDrawCount(newCount);
        if (newCount >= MAX_DRAW_COUNT) {
          setDrawTip("No draws left today");
        }
      }
      setTimeout(() => {
        setAnimatingStick(lidx % 3);
        setIsDrawing(false);
        setTxSent(false);
      }, 300);
    }
  }, [animationDone, txSent, isDrawing]);

  async function drawLuck() {
    // Clear all error messages at the start of new draw
    setDrawTip("");
    setMintTip("");

    if (!isConnected) {
      setDrawTip("Please connect your wallet");
      return;
    }
    if (chainId !== monadTestnet.id) {
      setDrawTip("Please switch to Monad Testnet");
      return;
    }
    if (drawCount >= MAX_DRAW_COUNT) {
      setDrawTip("No draws left today");
      return;
    }
    if (isDrawing) return;
    setIsDrawing(true);
    setTxSent(false);
    setAnimationDone(false);

    try {
      // Step 1: Generate fresh fortune content for this draw
      setMintTip("Generating fortune...");

      try {
        // Generate fresh content with market context for each draw
        const freshContent = await generateFortuneContent(true);
        setFortuneContent(freshContent);
        setMintTip("Fortune generated, preparing draw...");
      } catch (aiError) {
        console.warn("AI generation failed, using cached content:", aiError);
        // Fallback to cached content if AI generation fails
        setMintTip("Using cached fortune, preparing draw...");
      }

      // Step 2: Start the drawing animation
      // Since we now generate single fortune per API call, always use index 0
      finalIdx.current = 0;
      let duration = 0;
      const minDuration = 3000;
      const interval = 300;

      if (stickTimer.current) clearInterval(stickTimer.current);
      stickTimer.current = setInterval(() => {
        duration += interval;
        setAnimatingStick(Math.floor(Math.random() * 3));
        if (duration >= minDuration) {
          setAnimationDone(true);
        }
      }, interval);

      // Step 3: Prepare and send blockchain transaction
      setMintTip("Preparing mint transaction...");

      // 编码合约调用数据 - mint() 无参数函数
      const data = encodeFunctionData({
        abi: CONTRACT_ABI,
        functionName: 'mint',
        args: []
      });

      await sendTransactionAsync({
        to: CONTRACT_ADDRESS,
        value: parseEther("0.01"),
        data: data,
      });

      setMintTip("Mint transaction sent");
      setTxSent(true);

    } catch (e: any) {
      if (stickTimer.current) clearInterval(stickTimer.current);
      setIsDrawing(false);
      setTxSent(false);
      console.error("Draw process failed:", e);
      setDrawTip(`Transaction failed: ${e.message || "Unknown error"}`);
      return;
    }
  }

  function shareLuck() {
    // Use AI-generated content or fallback
    const currentContent = fortuneContent || getCachedFortuneContent();
    const currentFortune = currentContent.fortunes[luckIdx || 0];
    const currentProverb = currentContent.proverbs[proverbIdx || 0];

    const yiText = currentFortune.yi.join(", ");
    const jiText = currentFortune.ji.join(", ");

    actions?.composeCast &&
      actions.composeCast({
        text: `My fortune for ${getTodayStr()}: ${currentFortune.text} (${currentFortune.score}/100)\nDO: ${yiText}\nDON'T: ${jiText}\nProverb: ${currentProverb}\n#CryptoFortune #Monad`,
        embeds: [window.location.origin]
      });
  }

  // 三根签，抽中高亮
  function renderSticks() {
    return (
      <div className="flex flex-row items-center justify-center gap-4 mb-4">
        {[0, 1, 2].map((i) => {
          return (
            <div
              key={i}
              className={`w-3 h-16 border-2 rounded-none transition-colors duration-200 ${isDrawing
                  ? `stick-swing ${animatingStick === i ? "bg-[#ffe066] border-yellow-400" : "bg-[#23243a] border-[#333]"}`
                  : (luckIdx === i
                    ? "bg-[#ffe066] border-yellow-400 shadow-[2px_2px_0_#333]"
                    : "bg-[#23243a] border-[#333]")
                }`}
              style={{
                boxSizing: "border-box",
                transformOrigin: "bottom center",
                ...(isDrawing ? {
                  animation: `swing 2s ease-in-out infinite`
                } : {})
              }}
            />
          );
        })}
      </div>
    );
  }

  // 宜忌列表
  function renderYiJi() {
    // Use AI-generated content or fallback
    const currentContent = fortuneContent || getCachedFortuneContent();
    const currentFortune = currentContent.fortunes[luckIdx || 0];

    return (
      <div className="w-full grid grid-cols-2 gap-3 mb-3">
        <div className="col-span-1 p-2 border-2 border-green-400 bg-[#1f2b1f] shadow-[2px_2px_0_#333] rounded-none">
          <div className="text-green-300 text-xs font-bold mb-1 uppercase drop-shadow-[1px_1px_0_#333]">DO</div>
          <ul className="list-none text-[10px] text-green-200 space-y-1">
            {currentFortune.yi.map((item, i) => (
              <li key={`yi-${i}`} className="flex items-start">
                <span className="text-green-300 mr-1 font-bold">+</span> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="col-span-1 p-2 border-2 border-red-400 bg-[#2b1f1f] shadow-[2px_2px_0_#333] rounded-none">
          <div className="text-red-300 text-xs font-bold mb-1 uppercase drop-shadow-[1px_1px_0_#333]">DON&apos;T</div>
          <ul className="list-none text-[10px] text-red-200 space-y-1">
            {currentFortune.ji.map((item, i) => (
              <li key={`ji-${i}`} className="flex items-start">
                <span className="text-red-300 mr-1 font-bold">-</span> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // 渲染运势指数
  function renderLuckScore() {
    // Use AI-generated content or fallback
    const currentContent = fortuneContent || getCachedFortuneContent();
    const currentFortune = currentContent.fortunes[luckIdx || 0];

    const blocks = [];
    const totalBlocks = 5;
    const filledBlocks = Math.round(currentFortune.score / 100 * totalBlocks);

    for (let i = 0; i < totalBlocks; i++) {
      blocks.push(
        <div
          key={`block-${i}`}
          className={`w-4 h-4 border-2 ${i < filledBlocks
            ? "bg-[#ffe066] border-yellow-400"
            : "bg-[#23243a] border-[#333]"}`}
        />
      );
    }

    return (
      <div className="flex flex-col items-center mb-3">
        <div className="text-xs text-[#ffe066] uppercase mb-1">Luck Score: {currentFortune.score}/100</div>
        <div className="flex space-x-1">
          {blocks}
        </div>
      </div>
    );
  }

  // Render Cyber Proverb
  function renderProverb() {
    // Use AI-generated content or fallback
    const currentContent = fortuneContent || getCachedFortuneContent();
    const currentProverb = currentContent.proverbs[proverbIdx || 0];

    return (
      <div className="w-full p-2 border-2 border-blue-400 bg-[#1f1f2b] shadow-[2px_2px_0_#333] rounded-none mb-4">
        <div className="text-blue-300 text-xs font-bold mb-1 uppercase drop-shadow-[1px_1px_0_#333]">CYBER PROVERB</div>
        <div className="text-[10px] text-blue-200 italic text-center tracking-wide">
          &ldquo;{currentProverb}&rdquo;
        </div>
      </div>
    );
  }

  // Render terminal fortune output
  function renderTerminalFortune() {
    return (
      <div className="w-full p-2 border-2 border-green-800 bg-[#0d1a0d] shadow-[2px_2px_0_#333] rounded-none font-mono mt-4">
        <div className="text-[10px] text-green-500 font-bold">
          root@LuckLens:~# fortune
        </div>
        <div className="text-[10px] text-green-400 mt-1">
          In the world of blockchain, the greatest risk is not loss, but missing out.
        </div>
        <div className="text-[10px] text-green-300 mt-2 text-right italic">
          Made with ❤️ by Monad Fans
        </div>
      </div>
    );
  }

  // luck 相关渲染逻辑调整 - 使用AI生成的内容
  const currentContent = fortuneContent || getCachedFortuneContent();
  const luck = typeof luckIdx === 'number' ? currentContent.fortunes[luckIdx] : null;
  const proverb = typeof proverbIdx === 'number' ? currentContent.proverbs[proverbIdx] : null;

  return (
    <div className="w-full min-h-screen mx-0 p-0 relative flex flex-col items-center border-4 border-[#ffe066] bg-[#181c24] shadow-[4px_4px_0_0_#333] rounded-none" style={{ minHeight: 480 }}>
      {/* warpcast 跳转提示 */}
      {!isWarpcast ? (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <h2 className="text-base font-bold text-[#ffe066] tracking-widest uppercase drop-shadow-[2px_2px_0_#333] mb-2 text-center">Cyber Fortune Draw</h2>
          {/* 三根签动画始终开启 */}
          <div className="flex flex-row items-center justify-center gap-4 mb-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-3 h-16 border-2 rounded-none transition-colors duration-200 stick-swing bg-[#ffe066] border-yellow-400`}
                style={{
                  boxSizing: "border-box",
                  transformOrigin: "bottom center",
                  animation: `swing 2s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
          <div className="mb-6 text-center text-sm text-[#ffe066] font-medium max-w-xs">
            Discover your daily crypto fortune and get a unique on-chain proverb. For the full interactive experience, please open farcaster Mini App in Warpcast.
          </div>
          <button
            className="bg-[#ffe066] text-black font-bold px-6 py-3 rounded shadow-[2px_2px_0_#333] border-2 border-[#333] hover:bg-yellow-300 transition text-lg"
            onClick={() => {
              window.open(`https://warpcast.com/?launchFrameUrl=${encodeURIComponent(process.env.NEXT_PUBLIC_URL || '')}`, '_blank');
            }}
          >
            Open in Warpcast
          </button>
          {/* 全局动画样式，确保动画生效 */}
          <style jsx global>{`
            @keyframes swing {
              0%, 10% {
                transform: rotate(-20deg);
              }
              45%, 55% {
                transform: rotate(20deg);
              }
              90%, 100% {
                transform: rotate(-20deg);
              }
            }
            .stick-swing {
              animation-timing-function: ease-in-out;
            }
          `}</style>
        </div>
      ) : (
        <>
          {/* 背景像素图 */}
          {/* <Image
            src="/images/feed.png"
            alt="cyber trader background"
            fill
            style={{ objectFit: "cover", opacity: 0.18 }}
            className="pointer-events-none select-none"
            sizes="100vw"
          /> */}
          {/* 内容层 */}
          <div className="relative z-10 flex flex-col items-center justify-between w-full min-h-full p-4 pb-16 overflow-y-auto">
            {/* 上部分内容 */}
            <div className="flex flex-col items-center w-full">
              <div className="w-full text-xs text-[#ffe066] text-center mb-2 tracking-widest drop-shadow-[2px_2px_0_#333]">{getTodayStr()}</div>
              <div className="w-full text-xs text-center mb-2">
                <span className="inline-block bg-[#ffe066] text-black font-bold px-2 py-1 rounded shadow-[2px_2px_0_#333] border-2 border-[#333]">
                  Draws left today: {Math.max(0, MAX_DRAW_COUNT - drawCount)} / {MAX_DRAW_COUNT}
                </span>
              </div>
              <h2 className="text-base font-bold text-[#ffe066] tracking-widest uppercase drop-shadow-[2px_2px_0_#333] mb-2 text-center">Cyber Fortune Draw</h2>
              {renderSticks()}
              <div className={`font-bold text-center text-xl mb-2 drop-shadow-[2px_2px_0_#333] ${isDrawing ? "text-gray-500" : luck?.color} break-words whitespace-normal transition-colors duration-300`} style={{ minHeight: 30 }}>
                {isLoadingContent ? "Loading fortune..." : (isDrawing ? "Drawing..." : (luck ? luck.text : ""))}
              </div>

              {isDrawing ? (
                // Drawing状态下的占位内容，保持布局一致
                <div className="flex flex-col items-center w-full mb-4">
                  <div className="w-full h-16 bg-[#23243a] border-2 border-[#333] rounded-none mb-4 flex items-center justify-center">
                    <div className="text-gray-500 text-sm animate-pulse">Preparing your fortune...</div>
                  </div>
                  <div className="w-full h-20 bg-[#23243a] border-2 border-[#333] rounded-none mb-4 flex items-center justify-center">
                    <div className="text-gray-500 text-sm animate-pulse">Analyzing market conditions...</div>
                  </div>
                </div>
              ) : (
                luck && (
                  <>
                    {renderLuckScore()}
                    {renderYiJi()}
                    {proverb && renderProverb()}
                  </>
                )
              )}
            </div>

            {/* 下部分内容 - 按钮和状态信息 */}
            <div className="flex flex-col items-center w-full mt-auto">
              <div className="flex flex-row w-full gap-2 mb-3">
              <button
                className={`flex-1 min-w-0 rounded-none p-2 text-xs font-bold border-2 border-[#333] shadow-[2px_2px_0_#333] uppercase break-words whitespace-normal ${isDrawing || !isConnected || drawCount >= MAX_DRAW_COUNT || chainId !== monadTestnet.id
                    ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                    : "bg-[#ffe066] text-black hover:bg-yellow-300 transition"
                  }`}
                onClick={drawLuck}
                disabled={isDrawing || !isConnected}
              >
                {isDrawing || isMinting ? "Drawing..." :
                  (!isConnected ? "Connect Wallet" :
                    (drawCount >= MAX_DRAW_COUNT ? "No draws left" : (
                      <span className="flex flex-col leading-tight items-center justify-center">
                        <span>DRAW</span>
                        <span className="text-[10px] font-normal">0.01 MON</span>
                      </span>
                    ))
                  )
                }
              </button>
              <button
                className={`flex-1 min-w-0 rounded-none p-2 text-xs font-bold border-2 border-[#333] shadow-[2px_2px_0_#333] uppercase break-words whitespace-normal ${chainId === monadTestnet.id ? "bg-green-500 text-white" : "bg-red-500 text-white hover:bg-yellow-300 hover:text-black transition"
                  }`}
                onClick={() => switchChain({ chainId: monadTestnet.id })}
                disabled={chainId === monadTestnet.id}
              >
                {chainId === monadTestnet.id ? "Monad Testnet" : "Switch Network"}
              </button>
            </div>
            {drawTip && (
              <div className="w-full text-xs text-red-400 text-center mb-2">{drawTip === "Please connect your wallet" ? "Please connect your wallet" : drawTip === "Please switch to Monad Testnet" ? "Please switch to Monad Testnet" : drawTip === "No draws left today" ? "No draws left today" : drawTip}</div>
            )}
            {mintTip && (
              <div className="w-full text-xs text-purple-400 text-center mb-2">{mintTip}</div>
            )}
            {isError && (
              <div className="w-full text-xs text-red-400 text-center mb-2">Mint failed: {error?.message || "Unknown error"}</div>
            )}
            {isSuccess && txHash && (
              <div className="w-full text-xs text-green-400 text-center mb-2">
                Mint successful!
                <a href={`https://testnet.monadexplorer.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="underline ml-1">View Transaction</a>
              </div>
            )}
              <button
                className={`w-full rounded-none p-2 text-xs font-bold border-2 border-[#333] shadow-[2px_2px_0_#333] uppercase break-words whitespace-normal mb-4 ${isDrawing
                    ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                    : "bg-purple-500 text-white hover:bg-purple-400 transition"
                  }`}
                onClick={shareLuck}
                disabled={isDrawing}
              >
                Share My Fortune
              </button>

              {!isDrawing && renderTerminalFortune()}
            </div>
          </div>

          {/* 添加动画关键帧 */}
          <style jsx global>{`
            @keyframes swing {
              0%, 10% {
                transform: rotate(-20deg);
              }
              45%, 55% {
                transform: rotate(20deg);
              }
              90%, 100% {
                transform: rotate(-20deg);
              }
            }
            
            .stick-swing {
              animation-timing-function: ease-in-out;
            }
          `}</style>
        </>
      )}
    </div>
  );
} 