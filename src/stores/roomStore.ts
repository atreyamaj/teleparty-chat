import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

interface RoomState {
  roomId: string | null;
  nickname: string | null;
  connectionStatus: ConnectionStatus;
  connectionError: string | null;
}

interface RoomActions {
  setConnectionStatus: (status: ConnectionStatus) => void;
  setRoomDetails: (roomId: string, nickname: string) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  reconnect: () => void;
  setConnectionError: (error: string | null) => void;
  reset: () => void;
}

const initialState: RoomState = {
  roomId: null,
  nickname: null,
  connectionStatus: 'idle',
  connectionError: null,
};

export const useRoomStore = create<RoomState & RoomActions>()(
  immer((set, get) => ({
    ...initialState,
    setConnectionStatus: (status) => {
      set((state) => {
        state.connectionStatus = status;
        if (status === 'connected') {
          state.connectionError = null;
        }
      });
    },
    setRoomDetails: (roomId, nickname) => {
      set((state) => {
        state.roomId = roomId;
        state.nickname = nickname;
      });
    },
    joinRoom: (roomId) => {
      const nickname = get().nickname;
      if (!nickname) {
        set(state => {
          state.connectionError = "Cannot join room: Nickname is not set";
          state.connectionStatus = 'error';
        });
        return;
      }

      set(state => {
        state.connectionStatus = 'connecting';
        state.roomId = roomId;
      });

      console.log(`Joining room ${roomId} as ${nickname}`);
      
      setTimeout(() => {
        set(state => {
          state.connectionStatus = 'connected';
        });
      }, 1000);
    },
    leaveRoom: () => {
      const currentStatus = get().connectionStatus;
      if (currentStatus === 'connected' || currentStatus === 'connecting') {
        console.log("Leaving room");
        
        set(state => {
          state.connectionStatus = 'idle';
          state.roomId = null;
        });
      }
    },
    reconnect: () => {
      const roomId = get().roomId;
      if (!roomId) {
        set(state => {
          state.connectionError = "Cannot reconnect: Room ID is not set";
          state.connectionStatus = 'error';
        });
        return;
      }

      set(state => {
        state.connectionStatus = 'connecting';
      });

      console.log(`Reconnecting to room ${roomId}`);
      
      setTimeout(() => {
        set(state => {
          state.connectionStatus = 'connected';
        });
      }, 1000);
    },
    setConnectionError: (error) => {
      set((state) => {
        state.connectionError = error;
        if (error) {
          state.connectionStatus = 'error';
        }
      });
    },
    reset: () => {
      set(initialState);
    },
  })),
);

export const selectRoomId = (state: RoomState) => state.roomId;
export const selectNickname = (state: RoomState) => state.nickname;
export const selectConnectionStatus = (state: RoomState) => state.connectionStatus;
