import { describe, it, expect, beforeEach } from 'vitest';
import { useRoomStore } from '../roomStore';
import { act } from '@testing-library/react';

describe('useRoomStore', () => {
  // Reset store before each test
  beforeEach(() => {
    act(() => {
      useRoomStore.getState().reset();
    });
  });

  it('should have correct initial state', () => {
    const state = useRoomStore.getState();
    expect(state.roomId).toBeNull();
    expect(state.nickname).toBeNull();
    expect(state.connectionStatus).toBe('idle');
  });

  it('setConnectionStatus should update connectionStatus', () => {
    act(() => {
      useRoomStore.getState().setConnectionStatus('connecting');
    });
    expect(useRoomStore.getState().connectionStatus).toBe('connecting');

    act(() => {
      useRoomStore.getState().setConnectionStatus('connected');
    });
    expect(useRoomStore.getState().connectionStatus).toBe('connected');
  });

  it('setRoomDetails should update roomId and nickname', () => {
    act(() => {
      useRoomStore.getState().setRoomDetails('room-abc', 'User1');
    });
    const state = useRoomStore.getState();
    expect(state.roomId).toBe('room-abc');
    expect(state.nickname).toBe('User1');
  });

  it('reset should restore initial state', () => {
    // Modify state first
    act(() => {
      useRoomStore.getState().setConnectionStatus('connected');
      useRoomStore.getState().setRoomDetails('room-xyz', 'User2');
    });

    // Reset
    act(() => {
      useRoomStore.getState().reset();
    });

    // Check if back to initial
    const state = useRoomStore.getState();
    expect(state.roomId).toBeNull();
    expect(state.nickname).toBeNull();
    expect(state.connectionStatus).toBe('idle');
  });
});
