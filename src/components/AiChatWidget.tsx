import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAiChat, ChatMessage } from '../context/AiChatContext';

const LEVEL_2_PROMPTS = [
  { label: "⚡ Remplir ma réservation en direct", prompt: "L'aide peut elle directement remplir les champs de réservation en conversant avec son interlocuteur ?" },
  { label: "🚑 Quel transport choisir ?", prompt: "Explique-moi la différence entre un Taxi conventionné, un VSL et une Ambulance, et comment choisir selon mon ordonnance." },
  { label: "✍️ M'aider à remplir le formulaire", prompt: "Aide-moi à remplir le formulaire de réservation pas à pas." },
  { label: "🔍 Vérifier mon NIR (Sécu)", prompt: "Peux-tu vérifier la conformité de mon numéro de sécurité sociale (NIR) et m'expliquer le calcul de la clé ?" },
  { label: "⏱️ Vérifier mon heure de départ (Trafic)", prompt: "Comment vérifier si mon heure de départ est suffisante pour un rendez-vous au CHU avec les embouteillages en Martinique ?" },
  { label: "📑 Checklist PMT Cerfa S3138", prompt: "Quels sont les 5 critères obligatoires sur ma Prescription Médicale de Transport pour que la CPAM accepte le remboursement ?" },
  { label: "📋 Les 5 étapes de réservation", prompt: "Quelles sont les 5 étapes pour réserver un transport sur Médic'Trans ?" },
  { label: "❓ FAQ & Tiers-payant", prompt: "Quelles sont les règles de prise en charge CPAM 972, tiers-payant, accompagnateur et trajets de plus de 150 km ?" }
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
    isTyping,
    pendingDraft,
    applyDraftToBooking
  } = useAiChat();

  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isOnBookingPage = location.pathname === '/reserver';

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

  const handleGoToBooking = () => {
    closeChat();
    if (!isOnBookingPage) {
      navigate('/reserver');
    }
  };

  const formatMessageText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Transformation markdown bold
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

      if (line.trim().startsWith('✅') || line.trim().startsWith('❌') || line.trim().startsWith('🔍') || line.trim().startsWith('⏱️') || line.trim().startsWith('⚠️') || line.trim().startsWith('📌')) {
        return (
          <div key={idx} className="my-1 font-medium">
            {renderedParts}
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
            className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-primary via-primary-container to-primary text-on-primary rounded-full shadow-2xl hover:shadow-primary/30 hover:scale-105 transition-all duration-200 border-2 border-surface-container-lowest/20 focus:outline-none focus:ring-4 focus:ring-primary/30"
            aria-label="Eva - Aide à la réservation"
          >
            <div className="relative flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">
                support_agent
              </span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-primary animate-pulse" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-xs tracking-tight whitespace-nowrap leading-none">
                Eva
              </span>
              <span className="text-[10px] text-white/90 font-semibold tracking-tight whitespace-nowrap leading-none mt-0.5">
                Aide à la réservation
              </span>
            </div>
          </button>
        </div>
      )}

      {/* 2. Fenêtre de Chat Moderne et Responsive */}
      {isOpen && (
        <div
          id="ai-chat-window"
          className="fixed inset-x-3 bottom-3 top-20 sm:top-auto sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[440px] sm:h-[640px] max-h-[85vh] z-50 flex flex-col bg-surface-container-lowest rounded-3xl shadow-[0_12px_40px_rgba(11,28,48,0.2)] border border-outline-variant/30 overflow-hidden animate-fadeIn"
          role="dialog"
          aria-label="Eva - Aide à la réservation"
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
                    Eva - Aide à la réservation
                  </h3>
                  <span className="text-[9px] uppercase font-mono font-bold bg-white/20 px-1.5 py-0.5 rounded text-white tracking-wider">
                    NIVEAU 2
                  </span>
                </div>
                <p className="text-[11px] text-white/85 leading-tight mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  Assistante Médic'Trans 972
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                id="btn-ai-chat-clear"
                onClick={clearHistory}
                title="Effacer l'historique et réinitialiser"
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

          {/* Bandeau contextuel : Page de réservation */}
          {isOnBookingPage && (
            <div className="px-3.5 py-2 bg-primary/10 border-b border-primary/20 flex items-center justify-between text-xs text-primary shrink-0 animate-fadeIn">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-base">edit_document</span>
                <span>Mode Guidage Formulaire Actif</span>
              </div>
              <span className="text-[10px] text-primary/80 font-mono">/reserver</span>
            </div>
          )}

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
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-primary text-on-primary rounded-br-xs'
                        : 'bg-surface-container-lowest text-on-surface border border-outline-variant/30 rounded-bl-xs'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-primary mb-1">
                        <span className="material-symbols-outlined text-xs">verified</span>
                        <span>Eva - Aide à la réservation</span>
                      </div>
                    )}
                    <div className="space-y-1">{formatMessageText(msg.content)}</div>
                  </div>

                  {/* Bouton d'action formulaire si présent */}
                  {!isUser && msg.formDraft && (
                    <div className="mt-2 w-full max-w-[88%] p-3 rounded-2xl bg-secondary/10 border border-secondary/30 flex flex-col gap-2">
                      <div className="text-xs font-bold text-secondary flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">task_alt</span>
                        <span>Données de transport prêtes pour votre commande</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleGoToBooking}
                        className="w-full py-2 px-3 bg-secondary text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs hover:bg-secondary/90 transition-colors"
                      >
                        <span>Appliquer à ma réservation</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    </div>
                  )}

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
                  Le copilote analyse et rédige sa réponse...
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

          {/* Suggestions de questions rapides Niveau 2 */}
          <div className="p-2.5 bg-surface-container-low border-t border-outline-variant/20 overflow-x-auto whitespace-nowrap flex gap-1.5 scrollbar-none">
            {LEVEL_2_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickPrompt(item.prompt)}
                disabled={isTyping}
                className="px-2.5 py-1.5 rounded-full text-[11px] font-semibold bg-surface-container-lowest text-primary hover:bg-primary hover:text-on-primary border border-primary/20 transition-all shrink-0 shadow-2xs"
              >
                {item.label}
              </button>
            ))}
          </div>

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
                placeholder="Posez une question, vérifiez un NIR ou un horaire..."
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
            <div className="flex items-center justify-between text-[10px] text-on-surface-variant/70 leading-tight px-1">
              <span>Eva • Aide à la réservation • Niveau 2</span>
              <span>Urgence vitale : <strong className="text-error font-bold">15</strong></span>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
