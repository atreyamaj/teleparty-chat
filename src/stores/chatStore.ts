import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';

export interface ChatMessage {
  id: string;
  content: string;
  senderName: string;
  senderId: string;
  timestamp: Date;
  isSystemMessage?: boolean;
  isLocalOnly?: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

interface ChatActions {
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  addSystemMessage: (content: string) => void;
  clearMessages: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
};

export const useChatStore = create<ChatState & ChatActions>()(
  immer((set) => ({
    ...initialState,
    
    addMessage: (message) => {
      set((state) => {
        state.messages.push({
          ...message,
          id: uuidv4(),
          timestamp: new Date(),
        });
      });
    },
    
    addSystemMessage: (content) => {
      set((state) => {
        state.messages.push({
          id: uuidv4(),
          content,
          senderName: 'System',
          senderId: 'system',
          timestamp: new Date(),
          isSystemMessage: true,
        });
      });
    },
    
    clearMessages: () => {
      set((state) => {
        state.messages = [];
      });
    },
    
    setLoading: (isLoading) => {
      set((state) => {
        state.isLoading = isLoading;
      });
    },
    
    setError: (error) => {
      set((state) => {
        state.error = error;
      });
    },
  }))
);
