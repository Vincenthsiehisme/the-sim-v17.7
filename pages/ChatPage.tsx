
import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { usePersona, useChatMessages } from '../context/PersonaContext';
import { createChatSession, sendMessageToTwinStream } from '../services/geminiService';
import { useAvatarGenerator } from '../hooks/useAvatarGenerator';
import { AvatarDisplay } from '../components/dashboard';
import { ContextTuner } from '../components/ContextTuner';
import { ChatMessage, DigitalTwinPersona } from '../types';
import { Send, User, Loader2, Info, X, Sliders, MessageSquareDashed, Settings, Brain, Coffee, ShoppingCart, BookOpen, Search } from 'lucide-react';
import { getAvatarTitle } from '../utils/personaAnalytics';

// === NEW: Micro-Interaction Loader Component ===
const MicroInteractionLoader: React.FC<{ persona: DigitalTwinPersona }> = ({ persona }) => {
  const [text, setText] = useState("輸入中...");
  const archetype = persona.context_profile?.marketing_archetype?.decision_archetype || "";

  useEffect(() => {
    // 1. Define behavioral states based on archetype
    let steps = ["輸入中...", "思考中..."];

    if (archetype.includes("精算") || archetype.includes("務實")) {
        // Calculator Archetype
        steps = ["輸入中...", "查詢價格中...", "計算 CP 值...", "輸入中...", "比對規格..."];
    } else if (archetype.includes("焦慮") || archetype.includes("猶豫") || archetype.includes("觀望")) {
        // Anxious Archetype
        steps = ["輸入中...", "猶豫中...", "查看評論...", "輸入中...", "確認評價..."];
    } else if (archetype.includes("衝動") || archetype.includes("直覺") || archetype.includes("體驗")) {
        // Impulse Archetype
        steps = ["輸入中...", "看到有趣的東西...", "輸入中..."];
    } else if (archetype.includes("防備") || archetype.includes("懷疑")) {
        // Skeptic Archetype
        steps = ["輸入中...", "查證來源中...", "懷疑中...", "輸入中..."];
    } else {
        // General
        steps = ["輸入中...", "滑手機中...", "搜尋相關資訊...", "輸入中..."];
    }

    // 2. Cycle through steps
    let index = 0;
    const interval = setInterval(() => {
        index = (index + 1) % steps.length;
        setText(steps[index]);
    }, 1800); // Change roughly every 2 seconds

    return () => clearInterval(interval);
  }, [archetype]);

  return (
    <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none md:rounded-tl-none border border-slate-200 shadow-sm flex items-center gap-2.5 min-w-[120px]">
       <Loader2 className="h-4 w-4 text-indigo-600 animate-spin shrink-0" />
       <span className="text-xs text-slate-500 font-medium animate-pulse transition-all duration-300">{text}</span>
    </div>
  );
};

// Improved Formatter: Handles **bold** and (OS: ...) / <OS>...</OS> with Source Badges
const renderFormattedText = (text: string): React.ReactNode => {
  if (!text) return null;

  // 1. Detect OS Blocks (Parentheses or XML tags)
  // Regex looks for: (OS: ...) OR <OS>...</OS> OR (Context: ...)
  const osRegex = /(\(OS:[\s\S]*?\)|<OS>[\s\S]*?<\/OS>|\[Context:[\s\S]*?\])/gi;
  
  const parts = text.split(osRegex);
  
  return (
    <>
      {parts.map((part, i) => {
        // Check if this part is an OS block
        const isOS = part.match(/^\(OS:/i) || part.match(/^<OS>/i);
        const isContext = part.match(/^\[Context:/i);

        if (isOS) {
           // Clean up tags
           const rawContent = part.replace(/^(\(OS:|<OS>)|(\)|<\/OS>)$/gi, '').trim();
           
           // Detect Source Tags inside OS (e.g. [Source: PTT])
           const sourceMatch = rawContent.match(/\[(Source|Ref|來源):(.*?)\]/i);
           let displayContent = rawContent;
           let sourceTag = null;

           if (sourceMatch) {
               sourceTag = sourceMatch[2].trim();
               displayContent = rawContent.replace(sourceMatch[0], '').trim();
           }

           return (
             <div key={i} className="my-2 relative pl-4 py-2 pr-4 bg-indigo-50/60 rounded-r-xl border-l-4 border-indigo-400 text-xs text-indigo-900 animate-fade-in group">
                <div className="flex items-center gap-1.5 mb-1 text-indigo-500 font-bold text-[10px] uppercase tracking-wider">
                   <Brain className="w-3 h-3 group-hover:scale-110 transition-transform" /> 
                   <span>內心獨白 (Subtext)</span>
                </div>
                <div className="font-medium italic opacity-90 leading-relaxed">
                    {sourceTag && (
                        <span className="inline-flex items-center gap-1 bg-white/80 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider mr-1.5 not-italic border border-indigo-100 align-middle">
                            <Search className="w-2.5 h-2.5" /> {sourceTag}
                        </span>
                    )}
                    {displayContent}
                </div>
             </div>
           );
        }

        if (isContext) {
            // Hide System Context logs from view
            return null; 
        }

        // Render standard text with bold support
        // Split by **bold** syntax: **content**
        const boldParts = part.split(/(\*\*[\s\S]*?\*\*)/g).map((subPart, j) => {
            if (subPart.startsWith('**') && subPart.endsWith('**') && subPart.length >= 4) {
              return <strong key={`${i}-${j}`} className="font-bold">{subPart.slice(2, -2)}</strong>;
            }
            return subPart;
        });

        return <span key={i}>{boldParts}</span>;
      })}
    </>
  );
};

const ChatPage: React.FC = () => {
  const { persona, chatSession, setChatSession, setPersona, simulationModifiers, scenarioMode, setScenarioMode } = usePersona();
  const { messages, setMessages } = useChatMessages();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Controls for Panels
  const [showTunerMobile, setShowTunerMobile] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Ensure avatar is generated if user comes directly to this page
  const { isAvatarLoading, avatarError } = useAvatarGenerator(persona, setPersona);
  
  // Use a ref to track if greeting has been sent to avoid double execution in StrictMode
  const hasGreetedRef = useRef(false);

  // === SCENARIO MODE AUTO-SWITCH (FRIEND MODE - ON MOUNT ONLY) ===
  useEffect(() => {
    // When entering ChatPage, default to 'friend' mode to reduce hostility
    // We only do this once on mount to allow user to switch later
    setScenarioMode('friend');
  }, [setScenarioMode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial greeting & Session Creation
  useEffect(() => {
    if (!persona) return;

    if (!chatSession) {
      const newSession = createChatSession(persona);
      setChatSession(newSession);
    }

    // Only send greeting if chat is empty AND we haven't greeted in this session lifecycle yet
    if (messages.length === 0 && !hasGreetedRef.current) {
      hasGreetedRef.current = true;
      
      let greeting = "嗨，你好！";
      const tone = persona.interaction_style.tone_preference[0] || "";
      
      if (tone.includes("務實") || tone.includes("專業")) {
        greeting = "你好，有什麼事嗎？";
      } else if (tone.includes("熱情") || tone.includes("活潑")) {
        greeting = "嘿！找我聊天嗎？";
      } else if (tone.includes("焦慮") || tone.includes("急")) {
        greeting = "嗨，我現在有點忙，不過你說吧，怎麼了？";
      }

      setTimeout(() => {
         const initialMsg: ChatMessage = {
           role: 'model',
           text: greeting,
           timestamp: Date.now()
         };
         setMessages([initialMsg]);
      }, 800);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona]);

  if (!persona) {
    return <Navigate to="/" replace />;
  }

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping || !chatSession) return;

    const userText = input;
    setInput('');
    setIsTyping(true);

    // 1. Add User Message
    const userMsg: ChatMessage = { role: 'user', text: userText, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);

    try {
      // 2. Add Placeholder Bot Message
      const botMsgPlaceholder: ChatMessage = { role: 'model', text: '', timestamp: Date.now() };
      setMessages(prev => [...prev, botMsgPlaceholder]);

      // 3. Stream Response with Throttling & Modifier Context
      // Pass the current modifiers to be injected into the prompt
      // IMPORTANT: scenarioMode is passed from Context (should be 'friend' here)
      const stream = sendMessageToTwinStream(userText, chatSession, simulationModifiers, scenarioMode);
      
      let fullText = "";
      let lastUpdateTime = 0;
      
      for await (const chunk of stream) {
        fullText += chunk;
        
        // Throttling: Update state at most every 50ms to reduce render load
        const now = Date.now();
        if (now - lastUpdateTime > 50) {
            setMessages(prev => {
              const newArr = [...prev];
              if (newArr.length > 0) {
                 newArr[newArr.length - 1] = { 
                   ...newArr[newArr.length - 1], 
                   text: fullText 
                 };
              }
              return newArr;
            });
            lastUpdateTime = now;
        }
      }
      
      // Final update to ensure complete text is rendered
      setMessages(prev => {
        const newArr = [...prev];
        if (newArr.length > 0) {
           newArr[newArr.length - 1] = { 
             ...newArr[newArr.length - 1], 
             text: fullText 
           };
        }
        return newArr;
      });
      
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = { role: 'model', text: "（沈默不語...好像沒聽到）", timestamp: Date.now() };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const decisionArchetype = persona.context_profile?.marketing_archetype?.decision_archetype || "一般觀望型";

  return (
    // OPTIMIZED LAYOUT:
    // 1. Height: h-[calc(100vh-125px)] covers almost all space between Header (64px) and Footer (56px) with minimal margin.
    // 2. Padding: Reduced vertical padding (py-3) and horizontal padding (px-2 md:px-4) for app-like feel.
    // 3. Gap: Reduced gap-4 to tighten the layout.
    <div className="w-full max-w-7xl mx-auto px-2 md:px-4 h-[calc(100vh-125px)] flex flex-col md:flex-row gap-4 animate-fade-in relative py-3">
      
      {/* LEFT: Chat Area - Use flex-1 min-w-0 to allow proper shrinking */}
      <div className="flex-1 min-w-0 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
        
        {/* Scenario Mode Indicators */}
        <div className="absolute top-0 right-0 z-10 p-2 hidden md:block">
           {scenarioMode === 'friend' && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-100 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                 <Coffee className="w-3 h-3" /> 閒聊模式 (Friend)
              </div>
           )}
           {scenarioMode === 'sales' && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold border border-indigo-100 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                 <ShoppingCart className="w-3 h-3" /> 銷售模式 (Customer)
              </div>
           )}
           {scenarioMode === 'content' && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold border border-amber-100 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                 <BookOpen className="w-3 h-3" /> 內容模式 (Reader)
              </div>
           )}
        </div>

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white sticky top-0 z-20">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-100 shadow-sm bg-slate-50 relative">
                <AvatarDisplay avatarUrl={persona.avatar_url} isLoading={isAvatarLoading} error={avatarError} simple />
             </div>
             <div className="flex flex-col">
                <span className="text-sm font-black text-slate-900 truncate max-w-[150px]">
                  {getAvatarTitle(persona)}
                </span>
                <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                   {decisionArchetype}
                </span>
             </div>
           </div>
           
           {/* Mobile Tuner Toggle */}
           <button 
             onClick={() => setShowTunerMobile(true)}
             className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors"
           >
             <Sliders className="h-5 w-5" />
           </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-6 bg-slate-50/50">
          {messages.map((msg, idx) => {
            // SPECIAL RENDER: SYSTEM DIVIDER
            if (msg.isSystemEvent) {
               return (
                 <div key={idx} className="flex justify-center py-2 animate-fade-in">
                    <div className="bg-slate-200/50 text-slate-500 text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full flex items-center gap-2 border border-slate-200 shadow-sm">
                       <Settings className="w-3 h-3 text-slate-400" />
                       {msg.text.replace('--- ', '').replace(' ---', '')}
                    </div>
                 </div>
               );
            }

            const isUser = msg.role === 'user';
            return (
              <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
                <div className={`flex items-end md:items-start max-w-[95%] md:max-w-[85%] gap-2 md:gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                  
                  {/* Avatar Icon */}
                  <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm border-2 border-white mb-1 md:mb-0 transition-transform group-hover:scale-105 ${
                    isUser ? 'bg-slate-800' : 'bg-white'
                  }`}>
                    {isUser ? (
                      <User className="h-4 w-4 md:h-5 md:w-5 text-white" />
                    ) : (
                      <AvatarDisplay avatarUrl={persona.avatar_url} isLoading={isAvatarLoading} error={avatarError} simple />
                    )}
                  </div>

                  {/* Bubble */}
                  <div className={`px-4 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm break-words ${
                    isUser 
                      ? 'bg-slate-800 text-white rounded-br-none md:rounded-tr-none md:rounded-br-2xl' 
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none md:rounded-tl-none md:rounded-bl-2xl'
                  }`}>
                     <div className="whitespace-pre-wrap font-sans">{renderFormattedText(msg.text)}</div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* UPDATED: Dynamic Micro-Interaction Loader */}
          {isTyping && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start animate-fade-in">
               <div className="flex items-end md:items-start max-w-[80%] gap-2 md:gap-3">
                 <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0 border-2 border-white overflow-hidden mb-1 md:mb-0 shadow-sm">
                    <AvatarDisplay avatarUrl={persona.avatar_url} isLoading={isAvatarLoading} error={avatarError} simple />
                 </div>
                 {/* Replaced static loader with dynamic component */}
                 <MicroInteractionLoader persona={persona} />
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input - Increased padding for better visual weighting */}
        <div className="p-4 md:p-6 bg-white border-t border-slate-200 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] z-10">
          <form onSubmit={handleSend} className="flex gap-2 md:gap-3 max-w-4xl mx-auto w-full">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={scenarioMode === 'friend' ? `跟 ${getAvatarTitle(persona)} 隨便聊聊...` : `傳送訊息給 ${getAvatarTitle(persona)}...`}
              className="flex-1 rounded-full border-slate-200 border px-5 py-3 text-sm md:text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping || !chatSession}
              className="bg-indigo-600 text-white p-3 md:px-6 md:py-3 rounded-full font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Send className="h-5 w-5" />
              <span className="hidden md:inline ml-2">發送</span>
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT: Context Tuner (Desktop) - Auto Width */}
      <div className="hidden md:block shrink-0 h-full w-auto">
         <ContextTuner />
      </div>

      {/* Mobile Tuner Overlay */}
      {showTunerMobile && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm md:hidden flex justify-end">
           <div className="w-[85%] max-w-[320px] bg-white h-full shadow-2xl animate-fade-in-right flex flex-col">
              <div className="p-2 flex justify-end">
                 <button onClick={() => setShowTunerMobile(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              <div className="flex-1 overflow-hidden p-2 pt-0">
                 <ContextTuner />
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
