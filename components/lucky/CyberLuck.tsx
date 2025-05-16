"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { useAccount, useSwitchChain, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { monadTestnet } from "viem/chains";

const MAX_DRAW_COUNT = 3;

// 赛博箴言列表
const cyberProverbs = [
  "One day in crypto, three years in the real world.",
  "Don't fear buying in, don't panic selling out.",
  "If you don't harvest the leeks, there will be more next year.",
  "Stay calm in the bear, stay humble in the bull.",
  "No matter how much you gain, always secure profits.",
  "Lose money on rumors, win on trends.",
  "Invest within your means, it's not about the number of coins.",
  "Everything can go to zero, only your private key lasts forever.",
  "HODL till dawn, survive the night.",
  "Sideways markets reveal wisdom, pumps reveal human nature."
];

const luckList = [
  { 
    text: "极佳运势 🚀", 
    color: "text-green-400", 
    yi: ["大胆交易，勇敢出击", "参与空投，抓住机会", "布局长线，扩大份额"],
    ji: ["犹豫不决，错失良机", "过度谨慎，提前出局"],
    score: 95
  },
  { 
    text: "好运连连 💰", 
    color: "text-yellow-300", 
    yi: ["关注新币，积极参与", "跟随趋势，顺势而为"], 
    ji: ["贪心冒进，频繁换仓", "借钱投资，超出能力"],
    score: 80
  },
  { 
    text: "普通运势 🤖", 
    color: "text-blue-300", 
    yi: ["稳健持仓，学习新知", "适度分散，控制风险"], 
    ji: ["盲目跟风，追涨杀跌", "情绪交易，冲动决策"],
    score: 60
  },
  { 
    text: "小心波动 ⚡", 
    color: "text-orange-400", 
    yi: ["设置止损，谨慎加仓", "复盘策略，保持清醒"], 
    ji: ["重仓单一，情绪化操作", "透支资金，无视风险"],
    score: 40
  },
  { 
    text: "倒霉一天 🥲", 
    color: "text-red-400", 
    yi: ["休息观望，复盘总结", "远离交易，恢复心态"], 
    ji: ["冲动交易，逆势加仓", "强行抄底，连续追高"],
    score: 20
  },
  { 
    text: "谨慎交易 🧊", 
    color: "text-cyan-300", 
    yi: ["多看少动，关注安全", "检查私钥，备份钱包"], 
    ji: ["轻信消息，泄露私钥", "操作频繁，忘记备份"],
    score: 30
  },
];

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
  const { sendTransaction, data: txHash, isPending: isMinting, isError, error, isSuccess } = useSendTransaction();
  const { sendTransactionAsync } = useSendTransaction();
  const [txSent, setTxSent] = useState(false);
  
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
      const lidx = finalIdx.current;
      const pidx = Math.floor(Math.random() * cyberProverbs.length);
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
          setDrawTip("今日抽签次数已用完");
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
    if (!isConnected) {
      setDrawTip("请先连接钱包");
      return;
    }
    if (chainId !== monadTestnet.id) {
      setDrawTip("请切换到 Monad Testnet 网络");
      return;
    }
    if (drawCount >= MAX_DRAW_COUNT) {
      setDrawTip("今日抽签次数已用完");
      return;
    }
    if (isDrawing) return;
    setIsDrawing(true);
    setMintTip("");
    setTxSent(false);
    setAnimationDone(false);
    finalIdx.current = Math.floor(Math.random() * luckList.length);
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
    try {
      const tx = await sendTransactionAsync({
        to: CONTRACT_ADDRESS,
        value: parseEther("0.01"),
      });
      setMintTip("mint 交易已发送");
      setTxSent(true);
    } catch (e: any) {
      if (stickTimer.current) clearInterval(stickTimer.current);
      setIsDrawing(false);
      setTxSent(false);
      return;
    }
  }

  function shareLuck() {
    const yiText = luckList[luckIdx || 0].yi.join("、");
    const jiText = luckList[luckIdx || 0].ji.join("、");
    
    actions?.composeCast &&
      actions.composeCast({
        text: `我的${getTodayStr()}运势：${luckList[luckIdx || 0].text} (${luckList[luckIdx || 0].score}分)\n宜：${yiText}\n忌：${jiText}\n箴言：${cyberProverbs[proverbIdx || 0]}\n#CryptoFortune`,
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
              className={`w-3 h-16 border-2 rounded-none transition-colors duration-200 ${
                isDrawing
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
    return (
      <div className="w-full grid grid-cols-2 gap-3 mb-3">
        <div className="col-span-1 p-2 border-2 border-green-400 bg-[#1f2b1f] shadow-[2px_2px_0_#333] rounded-none">
          <div className="text-green-300 text-xs font-bold mb-1 uppercase drop-shadow-[1px_1px_0_#333]">今日宜</div>
          <ul className="list-none text-[10px] text-green-200 space-y-1">
            {luckList[luckIdx || 0].yi.map((item, i) => (
              <li key={`yi-${i}`} className="flex items-start">
                <span className="text-green-300 mr-1 font-bold">+</span> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="col-span-1 p-2 border-2 border-red-400 bg-[#2b1f1f] shadow-[2px_2px_0_#333] rounded-none">
          <div className="text-red-300 text-xs font-bold mb-1 uppercase drop-shadow-[1px_1px_0_#333]">今日忌</div>
          <ul className="list-none text-[10px] text-red-200 space-y-1">
            {luckList[luckIdx || 0].ji.map((item, i) => (
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
    const blocks = [];
    const totalBlocks = 5;
    const filledBlocks = Math.round(luckList[luckIdx || 0].score / 100 * totalBlocks);
    
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
        <div className="text-xs text-[#ffe066] uppercase mb-1">运势指数: {luckList[luckIdx || 0].score}分</div>
        <div className="flex space-x-1">
          {blocks}
        </div>
      </div>
    );
  }
  
  // Render Cyber Proverb
  function renderProverb() {
    return (
      <div className="w-full p-2 border-2 border-blue-400 bg-[#1f1f2b] shadow-[2px_2px_0_#333] rounded-none mb-4">
        <div className="text-blue-300 text-xs font-bold mb-1 uppercase drop-shadow-[1px_1px_0_#333]">CYBER PROVERB</div>
        <div className="text-[10px] text-blue-200 italic text-center tracking-wide">
          “{cyberProverbs[proverbIdx || 0]}”
        </div>
      </div>
    );
  }
  
  // Render terminal fortune output
  function renderTerminalFortune() {
    return (
      <div className="w-full p-2 border-2 border-green-800 bg-[#0d1a0d] shadow-[2px_2px_0_#333] rounded-none font-mono absolute bottom-0 left-0">
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

  // luck 相关渲染逻辑调整
  const luck = typeof luckIdx === 'number' ? luckList[luckIdx] : null;
  const proverb = typeof proverbIdx === 'number' ? cyberProverbs[proverbIdx] : null;

  return (
    <div className="w-full h-screen mx-0 p-0 relative flex flex-col items-center justify-center border-4 border-[#ffe066] bg-[#181c24] shadow-[4px_4px_0_0_#333] rounded-none overflow-hidden" style={{ minHeight: 480 }}>
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
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-4 pb-16">
        <div className="w-full text-xs text-[#ffe066] text-center mb-2 tracking-widest drop-shadow-[2px_2px_0_#333]">{getTodayStr()}</div>
        <div className="w-full text-xs text-center mb-2">
          <span className="inline-block bg-[#ffe066] text-black font-bold px-2 py-1 rounded shadow-[2px_2px_0_#333] border-2 border-[#333]">
            Draws left today: {Math.max(0, MAX_DRAW_COUNT - drawCount)} / {MAX_DRAW_COUNT}
          </span>
        </div>
        <h2 className="text-base font-bold text-[#ffe066] tracking-widest uppercase drop-shadow-[2px_2px_0_#333] mb-2 text-center">Cyber Fortune Draw</h2>
        {renderSticks()}
        <div className={`font-bold text-center text-xl mb-2 drop-shadow-[2px_2px_0_#333] ${isDrawing ? "text-gray-500" : luck?.color} break-words whitespace-normal transition-colors duration-300`} style={{ minHeight: 30 }}>
          {isDrawing ? "Drawing..." : (luck ? luck.text : "")}
        </div>
        
        {!isDrawing && luck && (
          <>
            {renderLuckScore()}
            {renderYiJi()}
            {proverb && renderProverb()}
          </>
        )}
        
        <div className="flex flex-row w-full gap-2 mb-3">
          <button
            className={`flex-1 min-w-0 rounded-none p-2 text-xs font-bold border-2 border-[#333] shadow-[2px_2px_0_#333] uppercase break-words whitespace-normal ${
              isDrawing || !isConnected || drawCount >= MAX_DRAW_COUNT || chainId !== monadTestnet.id
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
            className={`flex-1 min-w-0 rounded-none p-2 text-xs font-bold border-2 border-[#333] shadow-[2px_2px_0_#333] uppercase break-words whitespace-normal ${
              chainId === monadTestnet.id ? "bg-green-500 text-white" : "bg-red-500 text-white hover:bg-yellow-300 hover:text-black transition"
            }`}
            onClick={() => switchChain({ chainId: monadTestnet.id })}
            disabled={chainId === monadTestnet.id}
          >
            {chainId === monadTestnet.id ? "Monad Testnet" : "Switch Network"}
          </button>
        </div>
        {drawTip && (
          <div className="w-full text-xs text-red-400 text-center mb-2">{drawTip === "请先连接钱包" ? "Please connect your wallet" : drawTip === "请切换到 Monad Testnet 网络" ? "Please switch to Monad Testnet" : drawTip === "今日抽签次数已用完" || drawTip === "今日已达上限" ? "No draws left today" : drawTip}</div>
        )}
        {/* {mintTip && (
          <div className="w-full text-xs text-purple-400 text-center mb-2">{mintTip}</div>
        )} */}
        {/* {isError && (
          <div className="w-full text-xs text-red-400 text-center mb-2">mint 失败: {error?.message || "未知错误"}</div>
        )} */}
        {isSuccess && txHash && (
          <div className="w-full text-xs text-green-400 text-center mb-2">
            mint 成功！
            <a href={`https://testnet.monadexplorer.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="underline ml-1">查看交易</a>
          </div>
        )}
        <button
          className={`w-full rounded-none p-2 text-xs font-bold border-2 border-[#333] shadow-[2px_2px_0_#333] uppercase break-words whitespace-normal ${
            isDrawing 
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
    </div>
  );
} 