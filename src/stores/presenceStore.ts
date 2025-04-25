import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { debounce } from '../utils/debounce';
import { useRoomStore } from './roomStore';

// Interface for socket instance actions
export interface SocketInstanceActions {
  setTypingPresence: (typing: boolean) => void;
}

export interface TypingUser {
  userId: string;
  nickname: string;
}

export interface UserPresence {
  userId: string;
  nickname: string;
  isTyping: boolean;
  lastActive: Date;
  avatarUrl?: string;
}

interface PresenceState {
  users: Map<string, UserPresence>;
  typingUsers: Set<string>;
  usersTyping: TypingUser[];
  typingUserNicknames: string[];
  isCurrentUserTyping: boolean;
  lastTypingTimestamp: number | null;
  socketInstance: SocketInstanceActions | null;
}

interface PresenceActions {
  addUser: (user: UserPresence) => void;
  removeUser: (userId: string) => void;
  updateUser: (userId: string, updates: Partial<Omit<UserPresence, 'userId'>>) => void;
  setUserTyping: (userId: string, isTyping: boolean) => void;
  clearUsers: () => void;
  getTypingUsernames: () => string[];
  setUsersTyping: (users: TypingUser[]) => void;
  setTyping: (typing: boolean) => void;
  stopTypingAfterInactivity: () => void;
  setSocketInstance: (instance: SocketInstanceActions) => void;
  reset: () => void;
}

const TYPING_TIMEOUT = 3000; // 3 seconds

const initialState: PresenceState = {
  users: new Map(),
  typingUsers: new Set(),
  usersTyping: [],
  typingUserNicknames: [],
  isCurrentUserTyping: false,
  lastTypingTimestamp: null,
  socketInstance: null,
};

export const usePresenceStore = create<PresenceState & PresenceActions>()(
  immer((set, get) => ({
    ...initialState,
    
    addUser: (user) => {
      set((state) => {
        state.users.set(user.userId, {
          ...user,
          lastActive: new Date(),
        });
      });
    },
    
    removeUser: (userId) => {
      set((state) => {
        state.users.delete(userId);
        state.typingUsers.delete(userId);
      });
    },
    
    updateUser: (userId, updates) => {
      set((state) => {
        const user = state.users.get(userId);
        if (user) {
          state.users.set(userId, {
            ...user,
            ...updates,
            lastActive: new Date(),
          });
        }
      });
    },
    
    setUserTyping: (userId, isTyping) => {
      set((state) => {
        const user = state.users.get(userId);
        if (user) {
          state.users.set(userId, {
            ...user,
            isTyping,
            lastActive: new Date(),
          });
          
          if (isTyping) {
            state.typingUsers.add(userId);
          } else {
            state.typingUsers.delete(userId);
          }
        }
      });
    },
    
    clearUsers: () => {
      set((state) => {
        state.users.clear();
        state.typingUsers.clear();
      });
    },
    
    getTypingUsernames: () => {
      const state = get();
      const typingUsernames: string[] = [];
      
      state.typingUsers.forEach((userId) => {
        const user = state.users.get(userId);
        if (user) {
          typingUsernames.push(user.nickname);
        }
      });
      
      return typingUsernames;
    },

    setUsersTyping: (users) => {
      set((state) => {
        // Filter out current user from typing users
        const currentUserNickname = useRoomStore.getState().nickname;
        state.usersTyping = users.filter(user => user.nickname && user.nickname !== currentUserNickname);
        state.typingUserNicknames = state.usersTyping
          .map(user => user.nickname)
          .filter(nickname => typeof nickname === 'string' && nickname.trim() !== '');
      });
    },
    
    setTyping: (typing) => {
      set((state) => {
        state.isCurrentUserTyping = typing;
        state.lastTypingTimestamp = typing ? Date.now() : null;
        
        // Send typing status to server
        const debouncedSetTypingPresence = debounce((isTyping: boolean) => {
          const socketInstance = get().socketInstance;
          if (socketInstance) {
            socketInstance.setTypingPresence(isTyping);
          } else {
            console.warn("Socket instance not available for typing presence");
          }
        }, 300);
        
        debouncedSetTypingPresence(typing);
      });
    },
    
    stopTypingAfterInactivity: () => {
      const { isCurrentUserTyping, lastTypingTimestamp } = get();
      
      if (isCurrentUserTyping && lastTypingTimestamp) {
        const now = Date.now();
        if (now - lastTypingTimestamp > TYPING_TIMEOUT) {
          set((state) => {
            state.isCurrentUserTyping = false;
            
            // Notify server that user stopped typing
            const socketInstance = get().socketInstance;
            if (socketInstance) {
              socketInstance.setTypingPresence(false);
            }
          });
        }
      }
    },

    setSocketInstance: (instance) => {
      set((state) => {
        state.socketInstance = instance;
      });
    },
    
    reset: () => {
      set((state) => {
        state.usersTyping = [];
        state.isCurrentUserTyping = false;
        state.lastTypingTimestamp = null;
        // Don't reset socketInstance here to avoid disconnection issues
      });
    },
  }))
);

// Selector to check if anyone is typing
export const selectIsAnyoneTyping = (state: PresenceState) => state.usersTyping.length > 0;

// Selector to get array of nicknames who are typing
export const selectTypingUsers = (state: PresenceState) => 
  state.usersTyping.map(user => user.nickname);

// Selector to get array of nicknames who are typing
export const selectTypingUserNicknames = (state: PresenceState) => state.typingUserNicknames;
