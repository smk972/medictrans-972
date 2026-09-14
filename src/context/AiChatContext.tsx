import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isEmergency?: boolean;
  formDraft?: {
    transportType?: 'taxi' | 'vsl' | 'ambulance';
    pickupAddress?: string;
    destinationFacility?: string;
    transportDate?: string;
    transportTime?: string;
    patientNir?: string;
  };
}

interface FormDraftData {
  transportType?: 'taxi' | 'vsl' | 'ambulance';
  pickupAddress?: string;
  destinationFacility?: string;
  transportDate?: string;
  transportTime?: string;
  patientNir?: string;
}

interface AiChatContextType {
  isOpen: boolean;
  openChat: (initialPrompt?: string) => void;
  closeChat: () => void;
  toggleChat: () => void;
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => void;
  isTyping: boolean;
  error: string | null;
  pendingDraft: FormDraftData | null;
  applyDraftToBooking: (draft: FormDraftData) => void;
  consumePendingDraft: () => FormDraftData | null;
}

const STORAGE_KEY = 'medictrans_ai_chat_history_972';
const DRAFT_STORAGE_KEY = 'medictrans_ai_form_draft_972';

const AiChatContext = createContext<AiChatContextType | undefined>(undefined);

const WELCOME_MESSAGE: ChatMessage = {
  id: 'msg-welcome',
  role: 'assistant',
  content: `Bonjour ! Je suis **Eva - Aide à la réservation** pour Médic'Trans 972.\n\nJe suis spécialement formée pour vous accompagner de bout en bout :\n• 🚑 **Expliquer les différents transports** : Taxi conventionné, VSL, Ambulance\n• 🧭 **Guider votre démarche** pas à pas selon votre situation\n• ✍️ **Aider à remplir votre réservation** en ligne\n• 🔍 **Vérifier vos informations** (Numéro NIR de Sécurité Sociale, cohérence des horaires avec le trafic en Martinique, conformité PMT Cerfa S3138)\n• 📋 **Expliquer les 5 étapes de réservation** et le délai d'attribution de 24h\n• ❓ **Répondre à toutes vos questions fréquentes (FAQ)**\n\n*Comment puis-je vous aider aujourd'hui ?*`,
  timestamp: new Date().toISOString()
};

export const AiChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDraft, setPendingDraft] = useState<FormDraftData | null>(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignorer erreur de parsing
    }
    return [WELCOME_MESSAGE];
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Ignorer quota
    }
  }, [messages]);

  const openChat = (initialPrompt?: string) => {
    setIsOpen(true);
    if (initialPrompt) {
      sendMessage(initialPrompt);
    }
  };

  const closeChat = () => setIsOpen(false);
  const toggleChat = () => setIsOpen(prev => !prev);

  const clearHistory = () => {
    const freshMessages = [
      {
        ...WELCOME_MESSAGE,
        id: `msg-welcome-${Date.now()}`,
        timestamp: new Date().toISOString()
      }
    ];
    setMessages(freshMessages);
    sessionStorage.removeItem(STORAGE_KEY);
    setPendingDraft(null);
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  };

  const applyDraftToBooking = (draft: FormDraftData) => {
    setPendingDraft(draft);
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  };

  const consumePendingDraft = (): FormDraftData | null => {
    const draft = pendingDraft;
    setPendingDraft(null);
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    return draft;
  };

  const sendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isTyping) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString()
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
          conversationId: `conv-${sessionStorage.getItem('medictrans_conv_id') || Date.now()}`
        })
      });

      if (!res.ok) {
        throw new Error(`Erreur serveur (${res.status})`);
      }

      const data = await res.json();
      const assistantReply = data.response || "Je n'ai pas pu générer de réponse. Veuillez reformuler votre question.";

      const botMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: assistantReply,
        timestamp: data.timestamp || new Date().toISOString(),
        isEmergency: data.isEmergency,
        formDraft: data.formDraft
      };

      if (data.formDraft) {
        applyDraftToBooking(data.formDraft);
      }

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error('[AI Chat Context] Request error:', err);
      setError('Service momentanément indisponible. Vous pouvez contacter la régulation au 05 96 72 00 97.');
      const fallbackMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: "Désolé, une erreur technique est survenue lors de la communication. Pour toute question urgente, contactez notre équipe au **05 96 72 00 97**.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AiChatContext.Provider
      value={{
        isOpen,
        openChat,
        closeChat,
        toggleChat,
        messages,
        sendMessage,
        clearHistory,
        isTyping,
        error,
        pendingDraft,
        applyDraftToBooking,
        consumePendingDraft
      }}
    >
      {children}
    </AiChatContext.Provider>
  );
};

export function useAiChat() {
  const ctx = useContext(AiChatContext);
  if (!ctx) {
    throw new Error('useAiChat doit être utilisé à l\'intérieur d\'un AiChatProvider');
  }
  return ctx;
}
