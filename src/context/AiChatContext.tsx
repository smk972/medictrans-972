import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isEmergency?: boolean;
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
}

const STORAGE_KEY = 'medictrans_ai_chat_history_972';

const AiChatContext = createContext<AiChatContextType | undefined>(undefined);

const WELCOME_MESSAGE: ChatMessage = {
  id: 'msg-welcome',
  role: 'assistant',
  content: `Bonjour ! Je suis l'assistant support **Médic'Trans 972**.\n\nJe suis à votre disposition pour vous aider dans vos démarches de transport sanitaire en Martinique :\n• **Modes de transport** : Ambulance, VSL ou Taxi conventionné\n• **Documents requis** : Prescription Médicale de Transport (PMT Cerfa S3138)\n• **Prise en charge** : Tiers-Payant & CPAM Martinique (100% ALD)\n• **Réservation & Suivi** : Délai d'attribution de 24h, pot commun, annulation\n\n*Comment puis-je vous renseigner aujourd'hui ?*`,
  timestamp: new Date().toISOString()
};

export const AiChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

  // Sauvegarde dans sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Ignorer quota exceed
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
        isEmergency: data.isEmergency
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error('[AI Chat Context] Request error:', err);
      setError('Service momentanément indisponible. Vous pouvez contacter la régulation au 05 96 72 00 97.');
      const fallbackMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: "Désolé, une erreur technique est survenue lors de la communication. Pour toute urgence ou question urgente, vous pouvez nous joindre directement par téléphone au **05 96 72 00 97**.",
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
        error
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
