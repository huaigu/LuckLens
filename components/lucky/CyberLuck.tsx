"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";

// 赛博箴言列表
const cyberProverbs = [
  "币圈一天，人间三年",
  "上车不要怕，抛售不要慌",
  "韭菜不割，明年还有",
  "熊市不焦虑，牛市不贪婪",
  "不管涨多少，记得落袋为安",
  "听消息亏钱，看趋势盈利",
  "量力而行，币不在多",
  "一切归零，唯有私钥永存",
  "HODL 到底，熬出黎明",
  "横盘出真知，暴涨见人性"
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

export default function CyberLuck() {
  const [luckIdx, setLuckIdx] = useState(0);
  const luck = luckList[luckIdx];
  const [proverbIdx, setProverbIdx] = useState(Math.floor(Math.random() * cyberProverbs.length));
  const { actions } = useMiniAppContext();
  
  // 抽签动画状态
  const [isDrawing, setIsDrawing] = useState(false);
  const [animatingStick, setAnimatingStick] = useState(-1);

  function drawLuck() {
    // 如果已经在抽签，直接返回
    if (isDrawing) return;
    
    // 开始抽签动画
    setIsDrawing(true);
    
    // 随机闪烁动画
    let duration = 0;
    const totalDuration = 2500; // 2.5 秒动画
    const interval = 300; // 每300ms变化一次高亮签
    let stickTimer: NodeJS.Timeout | null = null;
    
    stickTimer = setInterval(() => {
      duration += interval;
      // 随机选一个签亮起
      setAnimatingStick(Math.floor(Math.random() * 3));
      
      // 动画结束
      if (duration >= totalDuration) {
        if (stickTimer) clearInterval(stickTimer);
        
        // 确定最终结果
        const finalIdx = Math.floor(Math.random() * luckList.length);
        setLuckIdx(finalIdx);
        setProverbIdx(Math.floor(Math.random() * cyberProverbs.length));
        
        // 延迟一点显示最终结果
        setTimeout(() => {
          setAnimatingStick(finalIdx % 3); // 最终点亮哪一根签
          setIsDrawing(false);
        }, 300);
      }
    }, interval);
  }

  function shareLuck() {
    const yiText = luck.yi.join("、");
    const jiText = luck.ji.join("、");
    
    actions?.composeCast &&
      actions.composeCast({
        text: `我的${getTodayStr()}运势：${luck.text} (${luck.score}分)\n宜：${yiText}\n忌：${jiText}\n箴言：${cyberProverbs[proverbIdx]}\n#CryptoFortune`,
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
                  : (luckIdx % 3 === i 
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
            {luck.yi.map((item, i) => (
              <li key={`yi-${i}`} className="flex items-start">
                <span className="text-green-300 mr-1 font-bold">+</span> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="col-span-1 p-2 border-2 border-red-400 bg-[#2b1f1f] shadow-[2px_2px_0_#333] rounded-none">
          <div className="text-red-300 text-xs font-bold mb-1 uppercase drop-shadow-[1px_1px_0_#333]">今日忌</div>
          <ul className="list-none text-[10px] text-red-200 space-y-1">
            {luck.ji.map((item, i) => (
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
    const filledBlocks = Math.round(luck.score / 100 * totalBlocks);
    
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
        <div className="text-xs text-[#ffe066] uppercase mb-1">运势指数: {luck.score}分</div>
        <div className="flex space-x-1">
          {blocks}
        </div>
      </div>
    );
  }
  
  // 渲染赛博箴言
  function renderProverb() {
    return (
      <div className="w-full p-2 border-2 border-blue-400 bg-[#1f1f2b] shadow-[2px_2px_0_#333] rounded-none mb-4">
        <div className="text-blue-300 text-xs font-bold mb-1 uppercase drop-shadow-[1px_1px_0_#333]">赛博箴言</div>
        <div className="text-[10px] text-blue-200 italic text-center tracking-wide">
          『{cyberProverbs[proverbIdx]}』
        </div>
      </div>
    );
  }
  
  // 渲染终端 fortune 输出
  function renderTerminalFortune() {
    return (
      <div className="w-full p-2 border-2 border-green-800 bg-[#0d1a0d] shadow-[2px_2px_0_#333] rounded-none font-mono absolute bottom-0 left-0">
        <div className="text-[10px] text-green-500 font-bold">
          root@LuckLens:~# fortune
        </div>
        <div className="text-[10px] text-green-400 mt-1">
          在区块链的世界里，最大的风险不是亏损，而是错过。
        </div>
        <div className="text-[10px] text-green-300 mt-2 text-right italic">
          Made with ❤️ by Monad Fans
        </div>
      </div>
    );
  }

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
        <h2 className="text-base font-bold text-[#ffe066] tracking-widest uppercase drop-shadow-[2px_2px_0_#333] mb-2 text-center">赛博抽签</h2>
        {renderSticks()}
        <div className={`font-bold text-center text-xl mb-2 drop-shadow-[2px_2px_0_#333] ${isDrawing ? "text-gray-500" : luck.color} break-words whitespace-normal transition-colors duration-300`} style={{ minHeight: 30 }}>
          {isDrawing ? "抽签中..." : luck.text}
        </div>
        
        {!isDrawing && (
          <>
            {renderLuckScore()}
            {renderYiJi()}
            {renderProverb()}
          </>
        )}
        
        <button
          className={`w-full mb-3 rounded-none p-2 text-xs font-bold border-2 border-[#333] shadow-[2px_2px_0_#333] uppercase break-words whitespace-normal ${
            isDrawing 
              ? "bg-gray-500 text-gray-300 cursor-not-allowed" 
              : "bg-[#ffe066] text-black hover:bg-yellow-300 transition"
          }`}
          onClick={drawLuck}
          disabled={isDrawing}
        >
          {isDrawing ? "抽签中..." : "抽签"}
        </button>
        <button
          className={`w-full rounded-none p-2 text-xs font-bold border-2 border-[#333] shadow-[2px_2px_0_#333] uppercase break-words whitespace-normal ${
            isDrawing 
              ? "bg-gray-500 text-gray-300 cursor-not-allowed" 
              : "bg-purple-500 text-white hover:bg-purple-400 transition"
          }`}
          onClick={shareLuck}
          disabled={isDrawing}
        >
          分享运势
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