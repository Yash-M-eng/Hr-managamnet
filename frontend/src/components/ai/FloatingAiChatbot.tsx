'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Sparkles, 
  X, 
  Send, 
  Maximize2, 
  MessageSquare,
  ChevronRight,
  Bot
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface FloatingMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'What is the average salary in India?',
  'Show salary distribution across the organization.',
  'Which department has the highest average salary?',
  'What is the total annual base compensation?'
];

/**
 * Normalizes multi-item text and bullet points into standard Markdown lists
 * so that ReactMarkdown always renders distinct stacked cards.
 */
function formatMessageForMarkdown(content: string): string {
  if (!content) return '';
  let text = content;

  // 1. Convert Unicode bullets (•, ●, ▪) to markdown list items
  text = text.replace(/([^\n])\s*[•●▪]\s*/g, '$1\n- ');
  text = text.replace(/^[•●▪]\s*/gm, '- ');

  // 2. Ensure a blank line before any markdown list item if preceded by normal paragraph text
  text = text.replace(/([^\n])\n(- |\* |\d+\. )/g, '$1\n\n$2');

  // 3. Normalize excessive blank lines
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

export function FloatingAiChatbot() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<FloatingMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hi! 👋 I'm your **ACME HR & Payroll AI Assistant**. Ask me about salaries, department averages, or organizational metrics!",
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Hide on login page or when already on dedicated /ai-assistant page
  if (pathname === '/login' || pathname === '/ai-assistant' || !user) {
    return null;
  }

  const handleSend = async (queryText?: string) => {
    const q = (queryText || input).trim();
    if (!q || loading) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: FloatingMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: currentTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/ask', { question: q });
      const botMsg: FloatingMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: res.data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: FloatingMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: err.response?.data?.message || 'Sorry, I encountered an issue querying the analytics service.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFullPage = () => {
    setIsOpen(false);
    router.push('/ai-assistant');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end select-auto">
      {/* Expanded Floating Chat Window */}
      {isOpen && (
        <div className="mb-3 w-[380px] h-[520px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-100px)] rounded-3xl bg-white border border-slate-200/90 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0a152d] via-[#10224d] to-[#183980] p-4 flex items-center justify-between text-white border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md relative">
                <Sparkles className="w-4 h-4 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0a152d]"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold tracking-tight text-white">ACME AI Assistant</h3>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <p className="text-[11px] text-blue-200/80">Payroll & Analytics Intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleOpenFullPage}
                title="Expand to Full Page"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Chat"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider shrink-0 mr-0.5">
              Ask:
            </span>
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full bg-white text-blue-600 hover:bg-blue-50 border border-blue-200/60 shadow-2xs transition-all whitespace-nowrap"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#f8fafc]/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {m.sender === 'assistant' ? (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-xs">
                    {user?.name ? user.name[0] : 'U'}
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs relative ${
                    m.sender === 'user'
                      ? 'bg-[#1864f7] text-white rounded-tr-none font-medium'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none font-normal'
                  }`}
                >
                  {m.sender === 'assistant' ? (
                    <div className="text-slate-800 leading-relaxed">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                          ul: ({ children }) => <ul className="my-2 space-y-1.5 pl-0 list-none">{children}</ul>,
                          ol: ({ children }) => <ol className="my-2 space-y-1.5 list-decimal pl-4">{children}</ol>,
                          li: ({ children }) => (
                            <li className="flex items-start gap-2 py-1.5 px-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 text-[11px] my-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1864f7] mt-1 shrink-0"></span>
                              <div className="flex-1 min-w-0 leading-normal">{children}</div>
                            </li>
                          ),
                          strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                          em: ({ children }) => <em className="italic text-slate-600">{children}</em>,
                        }}
                      >
                        {formatMessageForMarkdown(m.text)}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                  )}

                  <div
                    className={`text-[9px] text-right mt-1 font-medium ${
                      m.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 rounded-tl-none text-[11px] text-slate-500 flex items-center gap-2 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                  <span>Calculating live database facts...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200/90 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask ACME AI assistant..."
              disabled={loading}
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-[#1864f7] hover:bg-[#1253d4] text-white flex items-center justify-center shadow-md shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Close AI Assistant' : 'Ask AI Salary Assistant'}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 relative group cursor-pointer ${
          isOpen
            ? 'bg-slate-800 hover:bg-slate-900 shadow-slate-900/30 rotate-90 scale-95'
            : 'bg-gradient-to-tr from-[#1864f7] via-[#2563eb] to-[#4338ca] hover:scale-105 active:scale-95 shadow-blue-600/35 hover:shadow-blue-600/50'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <>
            <div className="relative">
              <Sparkles className="w-6 h-6 text-white animate-pulse" />
            </div>
            {/* Online Green Pulsing Indicator */}
            <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-400/40"></span>
            
            {/* Tooltip on hover */}
            <span className="absolute right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Ask AI Assistant
              <span className="absolute -right-1 top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900"></span>
            </span>
          </>
        )}
      </button>
    </div>
  );
}
