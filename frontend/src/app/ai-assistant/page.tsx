'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { 
  Sparkles, 
  Send, 
  Paperclip,
  ChevronRight,
  Database,
  Lightbulb
} from 'lucide-react';

import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  intent?: string;
  source?: 'GEMINI_LLM' | 'FALLBACK_ENGINE';
  groundedData?: any;
  providerStatus?: string;
  quotaExhausted?: boolean;
  timestamp: string;
}

const SUGGESTIONS = [
  'What is the average salary in India?',
  'Which department has the highest average salary?',
  'How many engineers earn more than 100,000 USD?',
  'Which country has the highest average salary?',
  'What is the total annual base compensation?',
  'Show salary distribution across the organization.',
];

/**
 * Automatically converts inline bullets (•, ●, ▪), continuous lists, and multi-item lines
 * into clean standard Markdown lists so that ReactMarkdown always renders them as structured list cards.
 */
function formatMessageForMarkdown(content: string): string {
  if (!content) return '';
  let text = content;

  // 1. Convert Unicode bullets (•, ●, ▪) to markdown list items
  // If bullets are inline (separated by spaces or dots) or at start of lines:
  text = text.replace(/([^\n])\s*[•●▪]\s*/g, '$1\n- ');
  text = text.replace(/^[•●▪]\s*/gm, '- ');

  // 2. Ensure a blank line before any markdown list item (- , * , 1. ) if preceded by normal paragraph text
  text = text.replace(/([^\n])\n(- |\* |\d+\. )/g, '$1\n\n$2');

  // 3. Normalize excessive blank lines
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

export default function AiAssistantPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: "Hello! I am ACME's AI Salary Analytics Assistant. I can answer questions about organizational compensation, country benchmarks, departmental averages, and headcount distributions using real-time database calculations.",
        timestamp: '10:24 AM',
      },
    ]);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (queryText?: string) => {
    const q = (queryText || input).trim();
    if (!q || loading) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
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
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: res.data.answer,
        intent: res.data.intent,
        source: res.data.source,
        groundedData: res.data.groundedData,
        providerStatus: res.data.providerStatus,
        quotaExhausted: res.data.quotaExhausted,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
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

  return (
    <div className="flex flex-col h-full space-y-4 overflow-hidden">
      {/* Title & Powered By Badge */}
      <div className="shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">
            AI Salary & Payroll Assistant
          </h1>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]">
            <Sparkles className="w-3.5 h-3.5 text-[#2563eb]" />
            <span>Powered by Google Gemini</span>
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Get instant insights from your organization&apos;s payroll and compensation data using natural language.
        </p>
      </div>

      {/* Suggested Questions Section matching screenshot */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs shrink-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#2563eb] uppercase tracking-wider py-1 mr-1">
            <Lightbulb className="w-4 h-4 text-[#2563eb]" />
            <span>SUGGESTED:</span>
          </div>
          {SUGGESTIONS.map((sq, i) => (
            <button
              key={i}
              onClick={() => handleSend(sq)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#f0f7ff] hover:bg-[#e0efff] text-[#1d4ed8] border border-[#dbeafe] transition-all"
            >
              <span>{sq}</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#60a5fa]" />
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Box Container with white background, expanded to fill available height and width */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3.5 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar Icon */}
              {m.sender === 'assistant' ? (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 shrink-0 relative">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 stroke-white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="10" rx="2"/>
                    <circle cx="12" cy="5" r="2"/>
                    <path d="M12 7v4"/>
                    <line x1="8" y1="16" x2="8" y2="16"/>
                    <line x1="16" y1="16" x2="16" y2="16"/>
                  </svg>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-[8px] font-bold text-white">
                    +
                  </span>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  {user?.name ? user.name[0] : 'U'}
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-[13px] leading-relaxed shadow-xs relative ${
                  m.sender === 'user'
                    ? 'bg-[#1864f7] text-white rounded-tr-none font-medium'
                    : 'bg-[#f8fafc] text-slate-800 border border-slate-200/90 rounded-tl-none font-normal shadow-xs'
                }`}
              >
                {/* Clean Markdown Rendering: Properly formats lists into stacked row items */}
                {m.sender === 'assistant' ? (
                  <div className="text-[13px] text-slate-800 leading-relaxed">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed text-slate-800">{children}</p>,
                        ul: ({ children }) => <ul className="my-2.5 space-y-2 pl-0 list-none">{children}</ul>,
                        ol: ({ children }) => <ol className="my-2.5 space-y-2 list-decimal pl-5 marker:text-[#1864f7] marker:font-semibold">{children}</ol>,
                        li: ({ children }) => (
                          <li className="flex items-start gap-3 py-2 px-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs text-slate-700 hover:border-blue-200 hover:shadow-xs transition-all">
                            <span className="w-2 h-2 rounded-full bg-[#1864f7] mt-1.5 shrink-0"></span>
                            <div className="flex-1 min-w-0 leading-relaxed text-[13px]">{children}</div>
                          </li>
                        ),
                        strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                        em: ({ children }) => <em className="italic text-slate-600">{children}</em>,
                        code: ({ children }) => <code className="px-1.5 py-0.5 rounded-md bg-slate-100 text-blue-700 font-mono text-xs">{children}</code>,
                      }}
                    >
                      {formatMessageForMarkdown(m.text)}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                )}

                {/* Message Timestamp */}
                <div
                  className={`text-[10px] text-right mt-1.5 font-medium ${
                    m.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0">
                <Sparkles className="w-5 h-5 animate-spin" />
              </div>
              <div className="p-4 rounded-2xl bg-[#f1f6ff] border border-[#e0edff] rounded-tl-none text-xs text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <span>Interpreting intent with Gemini & calculating live database facts...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar exactly matching screenshot with sparkle, attachment icon, and blue Ask button */}
        <div className="p-4 bg-white border-t border-slate-100">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3 bg-white border border-slate-300 rounded-2xl px-4 py-2 shadow-xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
          >
            <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question (e.g. 'What is the average salary in Germany?' or 'Show salary distribution')..."
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              title="Attach context (future)"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-5 py-2 bg-[#1864f7] hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/25 disabled:opacity-40 transition-all shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
