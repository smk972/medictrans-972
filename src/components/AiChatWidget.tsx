import React, { useState, useRef, useEffect } from 'react';
import { useAiChat, ChatMessage } from '../context/AiChatContext';

const QUICK_PROMPTS = [
  "Comment réserver un transport ?",
  "Quels documents pour une PMT ?",
  "Différence Taxi, VSL et Ambulance ?",
  "Prise en charge CPAM Martinique ?",
  "Délai d'attribution 24h & Pot commun"
];

export const AiChatWidget: React.FC = () => {
  const {
    isOpen,
    openChat,
    closeChat,
    toggleChat,
    messages,
    sendMessage,
    clearHistory,
    isTyping
  } = useAiChat();

  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll en bas à chaque nouveau message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Focus sur l'input à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 250);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;
    sendMessage(inputMessage);
    setInputMessage('');
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const formatMessageText = (text: string) => {
    // Parser simple de base pour gras (**texte**) et puces (• / -)
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Transformation simple du markdown bold
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const renderedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-bold text-on-surface">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
          return <em key={pIdx} className="italic text-on-surface/90">{part.slice(1, -1)}</em>;
        }
        return part;
      });

      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <div key={idx} className="flex items-start gap-1.5 ml-1 my-0.5">
            <span className="text-primary font-bold">•</span>
            <span>{renderedParts}</span>
          </div>
        );
      }

      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }

      return <p key={idx} className="leading-relaxed">{renderedParts}</p>;
    });
  };

  return (
    <>
      {/* 1. Bouton Flottant en bas à droite (présent sur toutes les pages) */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce-subtle group">
          <button
            type="button"
            id="btn-ai-chat-floating"
            onClick={toggleChat}
            className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full shadow-2xl hover:shadow-primary/30 hover:scale-105 transition-all duration-200 border-2 border-surface-container-lowest/20 focus:outline-none focus:ring-4 focus:ring-primary/30"
            aria-label="Ouvrir l'assistant IA de support client"
          >
            <div className="relative flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">
                smart_toy
              </span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-primary animate-pulse" />
            </div>
            <span className="font-bold text-sm tracking-tight whitespace-nowrap">
              Besoin d'aide ?
            </span>
          </button>
        </div>
      )}

      {/* 2. Fenêtre de Chat Moderne et Responsive */}
      {isOpen && (
        <div
          id="ai-chat-window"
          className="fixed inset-x-3 bottom-3 top-20 sm:top-auto sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[420px] sm:h-[620px] max-h-[85vh] z-50 flex flex-col bg-surface-container-lowest rounded-3xl shadow-[0_12px_40px_rgba(11,28,48,0.2)] border border-outline-variant/30 overflow-hidden animate-fadeIn"
          role="dialog"
          aria-label="Assistant IA de support Médic'Trans 972"
        >
          {/* En-tête du Chat */}
          <div className="bg-gradient-to-r from-primary via-primary-container to-primary text-on-primary px-4 py-3.5 flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-2xl bg-surface-container-lowest/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <span className="material-symbols-outlined text-2xl text-white">
                  support_agent
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm leading-tight text-white">
                    Assistant Médic'Trans
                  </h3>
                  <span className="text-[10px] uppercase font-mono font-bold bg-white/20 px-1.5 py-0.5 rounded text-white tracking-wider">
                    972
                  </span>
                </div>
                <p className="text-[11px] text-white/80 leading-tight mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  Support client & Transports sanitaires
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                id="btn-ai-chat-clear"
                onClick={clearHistory}
                title="Effacer l'historique"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">restart_alt</span>
              </button>
              <button
                type="button"
                id="btn-ai-chat-close"
                onClick={closeChat}
                title="Fermer l'assistant"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          </div>

          {/* Corps de la conversation */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-surface-container-low/40">
            {messages.map((msg: ChatMessage) => {
              const isUser = msg.role === 'user';

              if (msg.isEmergency) {
                return (
                  <div
                    key={msg.id}
                    className="p-3.5 rounded-2xl bg-error/10 border-2 border-error/30 text-error animate-shake"
                  >
                    <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                      <span className="material-symbols-outlined text-xl">warning</span>
                      <span>URGENCE MÉDICALE</span>
                    </div>
                    <div className="text-xs space-y-1.5 leading-relaxed text-on-surface">
                      {formatMessageText(msg.content)}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <a
                        href="tel:15"
                        className="flex-1 py-2 px-3 bg-error text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow hover:bg-error/90 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">call</span>
                        Appeler le 15 (SAMU)
                      </a>
                      <a
                        href="tel:112"
                        className="py-2 px-3 bg-surface-container text-on-surface font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-outline-variant/30 hover:bg-surface-container-high transition-colors"
                      >
                        112
                      </a>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fadeIn`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-primary text-on-primary rounded-br-xs'
                        : 'bg-surface-container-lowest text-on-surface border border-outline-variant/30 rounded-bl-xs'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-primary mb-1">
                        <span className="material-symbols-outlined text-xs">verified</span>
                        <span>Médic'Trans 972</span>
                      </div>
                    )}
                    <div className="space-y-1">{formatMessageText(msg.content)}</div>
                  </div>
                  <span className="text-[10px] text-on-surface-variant/70 mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}

            {/* Indicateur de frappe */}
            {isTyping && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 w-fit animate-pulse">
                <span className="material-symbols-outlined text-sm text-primary animate-spin">
                  autorenew
                </span>
                <span className="text-xs text-on-surface-variant italic font-medium">
                  L'IA est en train d'écrire...
                </span>
                <div className="flex items-center gap-1 ml-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions de questions rapides */}
          {messages.length <= 2 && (
            <div className="p-2.5 bg-surface-container-low border-t border-outline-variant/20 overflow-x-auto whitespace-nowrap flex gap-1.5 scrollbar-none">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickPrompt(prompt)}
                  disabled={isTyping}
                  className="px-2.5 py-1.5 rounded-full text-[11px] font-semibold bg-surface-container-lowest text-primary hover:bg-primary hover:text-on-primary border border-primary/20 transition-all shrink-0 shadow-2xs"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Formulaire de saisie */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-surface-container-lowest border-t border-outline-variant/30 flex flex-col gap-1.5 shrink-0"
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                placeholder="Posez votre question sur un transport..."
                disabled={isTyping}
                className="flex-1 py-2 px-3.5 bg-surface-container-low rounded-xl text-xs sm:text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/30 transition-all"
              />
              <button
                type="submit"
                id="btn-ai-chat-send"
                disabled={!inputMessage.trim() || isTyping}
                className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center hover:bg-primary-container disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs shrink-0"
                title="Envoyer"
              >
                <span className="material-symbols-outlined text-lg">send</span>
              </button>
            </div>
            <p className="text-[10px] text-center text-on-surface-variant/70 leading-tight">
              Assistance transport • En cas d'urgence médicale vitale, appelez le <strong className="text-error font-bold">15</strong>
            </p>
          </form>
        </div>
      )}
    </>
  );
};
