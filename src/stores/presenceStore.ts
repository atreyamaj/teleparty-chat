import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

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
}

interface PresenceActions {
  addUser: (user: UserPresence) => void;
  removeUser: (userId: string) => void;
  updateUser: (userId: string, updates: Partial<Omit<UserPresence, 'userId'>>) => void;
  setUserTyping: (userId: string, isTyping: boolean) => void;
  clearUsers: () => void;
  getTypingUsernames: () => string[];
}

const initialState: PresenceState = {
  users: new Map(),
  typingUsers: new Set(),
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
  }))
);
