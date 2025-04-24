import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

interface UserState {
  userIcon: string | null;
}

interface UserActions {
  setUserIcon: (icon: string | null) => void;
  reset: () => void;
}

const initialState: UserState = {
  userIcon: null,
};

export const useUserStore = create<UserState & UserActions>()(
  persist(
    immer((set) => ({
      ...initialState,
      setUserIcon: (icon) => {
        set((state) => {
          state.userIcon = icon;
        });
      },
      reset: () => {
        set(initialState);
      },
    })),
    {
      name: 'teleparty-user-store',
      partialize: (state) => ({
        userIcon: state.userIcon,
      }),
    }
  )
);

export const selectUserIcon = (state: UserState) => state.userIcon;