import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader, BrainCircuit, Play, Check, X } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendChatMessage } from '../services/geminiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRunCommand: (cmd: string) => void;
}

const AIChat: React.FC<Props> = ({ isOpen, onClose, onRunCommand }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
        id: 'init', 
        role: 'model', 
        text: 'Hello! I am your AI Linux Assistant running on Gemini 3 Pro. I can help you with shell commands, scripts, or analyzing your system. Complex problems will trigger my thinking mode.' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, confirmingId]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Prepare history for API
      const history = messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
      }));

      // Add current user message to history context for the call
      history.push({ role: 'user', parts: [{ text: userMsg.text }] });

      const responseText = await sendChatMessage(history, userMsg.text);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        isThinking: true // Gemini 3 Pro always thinks
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I encountered an error connecting to the AI service."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
  };

  const renderMessageContent = (msg: ChatMessage) => {
    if (msg.role === 'user') return <div className="whitespace-pre-wrap text-sm">{msg.text}</div>;

    // Split by code blocks
    const regex = /```(?:bash|sh|zsh)?\n([\s\S]*?)```/g;
    const parts = msg.text.split(regex);
    
    return (
        <div className="text-sm">
            {parts.map((part, index) => {
                if (index % 2 === 0) {
                    return <span key={index} className="whitespace-pre-wrap">{part}</span>;
                } else {
                    const cmd = part.trim();
                    const uniqueId = `${msg.id}-${index}`;
                    const isConfirming = confirmingId === uniqueId;

                    return (
                        <div key={index} className="my-3 bg-black/40 rounded-md border border-gray-700/50 overflow-hidden">
                            <div className="bg-gray-900/50 px-3 py-1.5 text-xs text-gray-500 border-b border-gray-700/50 flex justify-between items-center font-mono">
                                <span>Command</span>
                            </div>
                            <div className="p-3 font-mono text-xs text-green-300 bg-gray-950/30 overflow-x-auto whitespace-pre">
                                {cmd}
                            </div>
                            <div className="p-2 border-t border-gray-700/50 bg-gray-900/30 flex justify-end">
                                {isConfirming ? (
                                    <div className="flex items-center gap-2 animate-in fade-in duration-200">
                                        <span className="text-xs text-gray-400 mr-1">Execute?</span>
                                        <button 
                                            onClick={() => setConfirmingId(null)}
                                            className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                                            title="Cancel"
                                        >
                                            <X size={14} />
                                        </button>
                                        <button 
                                            onClick={() => {
                                                onRunCommand(cmd);
                                                setConfirmingId(null);
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded transition-colors"
                                        >
                                            <Check size={14} />
                                            Confirm
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setConfirmingId(uniqueId)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 text-gray-200 text-xs font-medium rounded transition-all group"
                                    >
                                        <Play size={14} className="text-blue-400 group-hover:text-blue-300" />
                                        Run
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                }
            })}
        </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-96 bg-gray-900 border-l border-gray-700 shadow-2xl flex flex-col z-20">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-850 flex items-center justify-between">
        <div className="flex items-center text-white">
          <div className="relative">
            <Bot className="text-purple-400 mr-2" />
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
            </span>
          </div>
          <span className="font-semibold">Gemini Assistant</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
      </div>
      
      {/* Model Badge */}
      <div className="bg-purple-900/20 px-4 py-2 text-xs text-purple-300 flex items-center border-b border-gray-800/50">
        <BrainCircuit size={14} className="mr-2" />
        <span>Powered by Gemini 3 Pro (Thinking Mode Enabled)</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-lg p-3 ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-gray-800 text-gray-200 rounded-bl-none'
            }`}>
              {msg.role === 'model' && (
                <div className="flex items-center gap-1 text-xs text-purple-400 mb-1 font-mono uppercase tracking-wide">
                    <Sparkles size={10} />
                    AI Response
                </div>
              )}
              {renderMessageContent(msg)}
            </div>
          </div>
        ))}
        {loading && (
           <div className="flex justify-start">
             <div className="bg-gray-800 rounded-lg p-3 rounded-bl-none flex items-center gap-2">
               <Loader size={16} className="animate-spin text-purple-400" />
               <span className="text-xs text-gray-400">Thinking deeply...</span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask about Linux commands..."
            className="w-full bg-gray-800 text-white rounded-lg pl-4 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none h-12 scrollbar-hide"
            disabled={loading}
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="absolute right-2 top-2 p-1 text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;