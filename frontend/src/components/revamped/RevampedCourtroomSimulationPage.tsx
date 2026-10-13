import React, { useState } from 'react';
import { Send, Mic, Sparkles, Scale, ShieldAlert, Award, ArrowRight, CornerDownLeft } from 'lucide-react';

interface SimulationMessage {
  id: string;
  sender: 'opposing_counsel' | 'bench_judge' | 'courtroom_coach' | 'lawyer';
  title: string;
  text: string;
  timestamp: string;
}

interface RevampedCourtroomSimulationPageProps {
  onNavigate: (view: 'home' | 'graph' | 'documents' | 'simulation' | 'verify') => void;
}

export const RevampedCourtroomSimulationPage: React.FC<RevampedCourtroomSimulationPageProps> = ({ onNavigate }) => {
  const [activeAgent, setActiveAgent] = useState<'opposing' | 'bench' | 'coach'>('opposing');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [messages, setMessages] = useState<SimulationMessage[]>([
    {
      id: 'msg-1',
      sender: 'opposing_counsel',
      title: 'Opposing Counsel',
      text: 'The petitioner is merely raising a technical objection. There is no substantive violation of Article 14. Can you explain how this action is discriminatory when the same procedure was followed in similar cases?',
      timestamp: '10:42 AM'
    }
  ]);

  const suggestedAngles = [
    {
      id: 'distinguish',
      title: 'Distinguish similar cases',
      prompt: 'In those cited cases, prior notice was issued under statutory guidelines. Here, the detention was executed without recording grounds under Section 50 of CrPC / BNSS.'
    },
    {
      id: 'factual',
      title: 'Highlight factual differences',
      prompt: 'The electronic CCTV log at 08:30 PM establishes that the petitioner was detained 36 hours prior to formal arrest entry, violating Article 22(2).'
    },
    {
      id: 'precedents',
      title: 'Cite relevant precedents',
      prompt: 'As held in Maneka Gandhi (1978) 1 SCC 248 and E.P. Royappa (1974) 4 SCC 3, state action must be free from arbitrariness and must strictly comply with natural justice.'
    },
    {
      id: 'fairness',
      title: 'Address procedural fairness',
      prompt: 'Even in administrative action, lack of an opportunity of hearing strikes at the root of legality, rendering the impugned order void ab initio.'
    }
  ];

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: SimulationMessage = {
      id: `msg-${Date.now()}`,
      sender: 'lawyer',
      title: 'Counsel (You)',
      text,
      timestamp: 'Just now'
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate multi-agent courtroom exchange
    setTimeout(() => {
      // 1. Bench Judge Intervenes
      const benchMsg: SimulationMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'bench_judge',
        title: 'Bench Judge',
        text: 'Counsel, let us examine that: Where in your petition under Article 226 is this non-compliance specifically pleaded? Did you raise this before the Magistrate during initial remand?',
        timestamp: 'Just now'
      };

      // 2. Courtroom Coach Strategizes
      const coachMsg: SimulationMessage = {
        id: `msg-${Date.now() + 2}`,
        sender: 'courtroom_coach',
        title: 'Courtroom Coach',
        text: 'Strategy Tip: Direct the Bench immediately to Page 14, Paragraph 12 of your petition. Anchor your response on the verified CCTV timestamp to show the procedural illegality occurred at the very threshold.',
        timestamp: 'Just now'
      };

      setMessages((prev) => [...prev, benchMsg, coachMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0c0d12] text-white overflow-hidden relative">
      {/* Background Courtroom Atmosphere: Dark Judicial Backdrop with Ashoka Emblem Warm Lighting */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-30">
        <div className="absolute top-10 right-10 w-[550px] h-[550px] bg-gradient-to-bl from-[#b45309]/15 via-transparent to-transparent rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[450px] h-[450px] bg-gradient-to-t from-[#c52828]/10 to-transparent rounded-full blur-[100px]" />
      </div>

      {/* 1) TOP BREADCRUMB BAR */}
      <div className="relative z-10 px-6 py-3 border-b border-[#1f2433] bg-[#111319] flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <span
            onClick={() => onNavigate('graph')}
            className="hover:text-white cursor-pointer transition-colors"
          >
            Sharma vs State of Maharashtra
          </span>
          <span className="text-slate-600">/</span>
          <span className="text-white font-serif">Simulation Arena</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#1e2332] text-slate-300 border border-[#2b3348] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LangGraph Multi-Agent Runtime Active
          </span>
        </div>
      </div>

      {/* 2) HERO BANNER & AGENT SWITCHER matching bottom-right design */}
      <div className="relative z-10 px-6 lg:px-12 pt-6 pb-4">
        {/* Eyebrow */}
        <div className="text-[11px] font-mono font-bold tracking-widest text-[#ef4444] uppercase mb-2">
          Courtroom Simulation
        </div>

        {/* Title */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-serif text-white tracking-tight mb-2">
              Be Ready For Every Question.
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Practice with AI agents — opposing counsel, bench judge and courtroom coach.
            </p>
          </div>

          {/* National Emblem Silhouette in Header Background */}
          <div className="hidden sm:flex items-center gap-2 text-slate-500 font-serif text-xs px-3 py-1.5 rounded-lg bg-[#141620] border border-[#222736]">
            <span>सत्यमेव जयते</span>
            <span className="text-slate-600">•</span>
            <span>HIGH COURT JURISDICTION</span>
          </div>
        </div>

        {/* 3-Agent Switcher Tabs matching design */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Agent 1: Opposing Counsel */}
          <div
            onClick={() => setActiveAgent('opposing')}
            className={`p-3.5 rounded-xl cursor-pointer border transition-all ${
              activeAgent === 'opposing'
                ? 'bg-[#22171a] border-[#e53935] shadow-lg shadow-[#e53935]/15'
                : 'bg-[#141620] hover:bg-[#1a1e2b] border-[#222736]'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
              <span className="text-xs font-semibold text-white">Opposing Counsel</span>
            </div>
            <div className="text-[11px] text-slate-400">Challenge your arguments and probe weaknesses.</div>
          </div>

          {/* Agent 2: Bench Judge */}
          <div
            onClick={() => setActiveAgent('bench')}
            className={`p-3.5 rounded-xl cursor-pointer border transition-all ${
              activeAgent === 'bench'
                ? 'bg-[#221c15] border-[#f59e0b] shadow-lg shadow-[#f59e0b]/15'
                : 'bg-[#141620] hover:bg-[#1a1e2b] border-[#222736]'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
              <span className="text-xs font-semibold text-white">Bench Judge</span>
            </div>
            <div className="text-[11px] text-slate-400">Ask critical questions on the case record.</div>
          </div>

          {/* Agent 3: Courtroom Coach */}
          <div
            onClick={() => setActiveAgent('coach')}
            className={`p-3.5 rounded-xl cursor-pointer border transition-all ${
              activeAgent === 'coach'
                ? 'bg-[#14221b] border-[#10b981] shadow-lg shadow-[#10b981]/15'
                : 'bg-[#141620] hover:bg-[#1a1e2b] border-[#222736]'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              <span className="text-xs font-semibold text-white">Courtroom Coach</span>
            </div>
            <div className="text-[11px] text-slate-400">Improve strategy and highlight evidentiary gaps.</div>
          </div>
        </div>
      </div>

      {/* 3) MAIN WORKSPACE: ACTIVE ARENA CHAT (LEFT) & SUGGESTED ANGLES (RIGHT) */}
      <div className="simulation-body-grid">
        {/* Left: Chat & Sparring Console matching design */}
        <div className="simulation-chat-box">
          {/* Message Thread */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.map((m) => {
              const isLawyer = m.sender === 'lawyer';
              const isOpposing = m.sender === 'opposing_counsel';
              const isBench = m.sender === 'bench_judge';
              const isCoach = m.sender === 'courtroom_coach';

              const badgeColor = isLawyer
                ? 'bg-blue-500'
                : isOpposing
                ? 'bg-[#ef4444]'
                : isBench
                ? 'bg-[#f59e0b]'
                : 'bg-[#10b981]';

              return (
                <div
                  key={m.id}
                  className={`p-4 rounded-xl border leading-relaxed text-xs sm:text-[13px] ${
                    isLawyer
                      ? 'bg-[#181d2c] border-[#2d3957] text-white ml-8 sm:ml-16'
                      : isOpposing
                      ? 'bg-[#1a1416] border-[#382025] text-slate-200 mr-4 sm:mr-12'
                      : isBench
                      ? 'bg-[#1c1914] border-[#3d321d] text-slate-200 mr-4 sm:mr-12'
                      : 'bg-[#131d17] border-[#1d3d2a] text-slate-200 mr-4 sm:mr-12'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${badgeColor}`} />
                      <span className="font-semibold text-white text-xs">{m.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{m.timestamp}</span>
                  </div>

                  <p className="leading-relaxed">{m.text}</p>
                </div>
              );
            })}

            {isTyping && (
              <div className="p-3 rounded-xl bg-[#141722] border border-[#242b3d] text-xs text-slate-400 flex items-center gap-2 w-max animate-pulse">
                <Sparkles size={13} className="text-[#ef4444]" />
                <span>Multi-agent reasoning in progress (Opposing Counsel & Bench)...</span>
              </div>
            )}
          </div>

          {/* Response Input Box with Microphone & Submit matching design */}
          <div className="p-4 border-t border-[#1f2433] bg-[#0e1017]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 bg-[#171a25] border border-[#262c3e] rounded-xl px-4 py-2.5 focus-within:border-[#e53935] transition-colors"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your response or courtroom argument..."
                className="flex-1 bg-transparent text-xs sm:text-[13px] text-white placeholder-slate-500 focus:outline-none"
              />

              <button
                type="button"
                onClick={() => alert('Microphone input simulated.')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Dictate with Microphone"
              >
                <Mic size={16} />
              </button>

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2 rounded-lg bg-[#c52828] hover:bg-[#e53935] disabled:opacity-40 text-white transition-all shadow-md shadow-[#c52828]/20"
                title="Send Argument"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>

        {/* Right: Suggested Angles Drawer matching design */}
        <div className="simulation-angles-panel">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-4 flex items-center justify-between">
              <span>Suggested Angles</span>
              <Sparkles size={13} className="text-[#ef4444]" />
            </div>

            <div className="space-y-2.5">
              {suggestedAngles.map((angle) => (
                <div
                  key={angle.id}
                  onClick={() => handleSendMessage(angle.prompt)}
                  className="p-3.5 rounded-xl bg-[#171a25] hover:bg-[#202534] border border-[#23293a] hover:border-[#3d4660] transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-white group-hover:text-[#ef4444] transition-colors">
                      {angle.title}
                    </span>
                    <CornerDownLeft size={12} className="text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                    {angle.prompt}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Jump back to Document Viewer or Case Graph */}
          <div className="pt-4 border-t border-[#1f2433] space-y-2">
            <button
              onClick={() => onNavigate('documents')}
              className="w-full py-2 px-3 rounded-lg bg-[#181c28] hover:bg-[#212638] text-xs font-medium text-slate-300 flex items-center justify-center gap-2 transition-colors"
            >
              <span>Review Petition under Article 226</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
