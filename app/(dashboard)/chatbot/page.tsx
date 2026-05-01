'use client';

import { useEffect, useState, useRef } from 'react';
import { Bot, Send, User, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export default function ChatbotPage() {
  const { language, t } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [thinking, setThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/chatbot');
      if (res.ok) {
        const data: Message[] = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching chat history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSend = async (message?: string) => {
    const userMessage = message || input.trim();
    if (!userMessage || loading) return;

    setInput('');
    setLoading(true);
    setThinking(true);

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userMessage }),
      });

      if (res.ok) {
        const data: Message[] = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
      setThinking(false);
    }
  };

  const quickActions = [
    { en: "What did I sell today?", sw: "Leo niliuza nini?" },
    { en: "What's out of stock?", sw: "Stock gani imekwisha?" },
    { en: "This week's profit?", sw: "Faida ya wiki hii?" },
    { en: "Top selling products?", sw: "Bidhaa zipi zinauzwa zaidi?" },
    { en: "This month's expenses?", sw: "Gharama za mwezi huu?" },
  ];

  const isSwahili = language === 'sw';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-slate-800">
              {isSwahili ? 'Duka Janja AI' : 'Duka Janja AI'}
            </h1>
            <p className="text-xs text-slate-500">
              {isSwahili ? 'Msaidizi wako wa POS' : 'Your POS Assistant'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-200px)] flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loadingHistory ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-10 h-10 text-indigo-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  {isSwahili ? 'Habari! Mi mi Duka Janja AI.' : 'Hello! I\'m Duka Janja AI.'}
                </h3>
                <p className="text-slate-500 mb-6">
                  {isSwahili ? 'Naweza kusaidia na POS yako. Niulie swali!' : 'I can help with your POS. Ask me anything!'}
                </p>
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {quickActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(isSwahili ? action.sw : action.en)}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-full text-sm hover:from-indigo-100 hover:to-purple-100 transition-colors border border-indigo-100"
                    >
                      {isSwahili ? action.sw : action.en}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-primary to-primary/90 text-white rounded-br-md'
                          : 'bg-slate-100 text-slate-800 rounded-bl-md'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {msg.role === 'assistant' && (
                          <Bot className="w-5 h-5 mt-0.5 text-indigo-500 flex-shrink-0" />
                        )}
                        <div className="flex-1 space-y-1">
                          {msg.content.split('\n').map((line, i) => (
                            <p key={i} className="text-sm leading-relaxed whitespace-pre-wrap">
                              {line}
                            </p>
                          ))}
                        </div>
                        {msg.role === 'user' && (
                          <User className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {(loading || thinking) && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl rounded-bl-md px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Bot className="w-5 h-5 text-indigo-500" />
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-slate-500 italic">
                            {isSwahili ? 'Duka Janja AI inafikiria...' : 'Duka Janja AI is thinking...'}
                          </span>
                          <div className="flex gap-1 ml-2">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200 p-4 bg-gradient-to-r from-slate-50 to-slate-100">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
                placeholder={isSwahili ? 'Andika ujumbe wako...' : 'Type your message...'}
                className="flex-1 px-5 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="px-6 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl hover:from-primary/90 hover:to-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-sm transition-all"
              >
                <span>{isSwahili ? 'Tuma' : 'Send'}</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {quickActions.slice(0, 3).map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(isSwahili ? action.sw : action.en)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  {isSwahili ? action.sw : action.en}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}