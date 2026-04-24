'use client';

import { useEffect, useState, useRef } from 'react';
import { Bot, Send, User } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

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
    }
  };

  const quickQuestions = [
    'How do I make a sale?',
    'How do I add products?',
    'How do I generate reports?',
    'Help me get started',
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-indigo-600" />
            <div>
            <h1 className="font-bold text-xl text-slate-800">AI Assistant</h1>
            <p className="text-xs text-slate-500">Get help with your POS system</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-200px)] flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loadingHistory ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-8 w-8"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-800 mb-2">Hello! I&apos;m your POS assistant</h3>
                <p className="text-slate-500 mb-6">How can I help you today?</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {quickQuestions.map((question) => (
                    <button
                      key={question}
                      onClick={() => setInput(question)}
                      className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm hover:bg-indigo-100 transition-colors"
                    >
                      {question}
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
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-primary text-white rounded-br-md'
                          : 'bg-slate-100 text-slate-800 rounded-bl-md'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {msg.role === 'assistant' && (
                          <Bot className="w-4 h-4 mt-0.5" />
                        )}
                        <div className="space-y-1">
                          {msg.content.split('\n').map((line, i) => (
                            <p key={i} className="text-sm">
                              {line}
                            </p>
                          ))}
                        </div>
                        {msg.role === 'user' && (
                          <User className="w-4 h-4 mt-0.5" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4" />
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200 p-4 bg-slate-50">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
