import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { usePresenceStore, selectIsAnyoneTyping, selectTypingUsers } from '../presenceStore';
import { act } from '@testing-library/react';
import { useRoomStore } from '../roomStore';

// Mock the roomStore to provide a nickname for user filtering
vi.mock('../roomStore', () => ({
  useRoomStore: {
    getState: vi.fn().mockReturnValue({ nickname: 'CurrentUser' })
  }
}));

// Mock the window object for socket access
const mockSocketSetTypingPresence = vi.fn();
const mockSocketInstance = {
  setTypingPresence: mockSocketSetTypingPresence
};

const user1 = { nickname: 'Alice', userId: 'user-1' };
const user2 = { nickname: 'Bob', userId: 'user-2' };
const currentUser = { nickname: 'CurrentUser', userId: 'user-current' };

describe('usePresenceStore', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    // Mock global window property
    (window as any).__SOCKET_INSTANCE__ = mockSocketInstance;
    // Reset store to initial state
    act(() => {
      usePresenceStore.getState().reset();
    });
    // Mock the system time
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should have correct initial state', () => {
    const state = usePresenceStore.getState();
    expect(state.usersTyping).toEqual([]);
    expect(state.isCurrentUserTyping).toBe(false);
    expect(state.lastTypingTimestamp).toBe(null);
  });

  it('setUsersTyping should update the usersTyping array', () => {
    act(() => {
      usePresenceStore.getState().setUsersTyping([user1]);
    });
    expect(usePresenceStore.getState().usersTyping).toEqual([user1]);

    act(() => {
      usePresenceStore.getState().setUsersTyping([user1, user2]);
    });
    expect(usePresenceStore.getState().usersTyping).toEqual([user1, user2]);

    act(() => {
      usePresenceStore.getState().setUsersTyping([]); // Clear typing users
    });
    expect(usePresenceStore.getState().usersTyping).toEqual([]);
  });

  it('setUsersTyping should filter out current user', () => {
    act(() => {
      usePresenceStore.getState().setUsersTyping([user1, currentUser]);
    });
    // Should only include user1, filtering out currentUser
    expect(usePresenceStore.getState().usersTyping).toEqual([user1]);
  });

  it('setTyping should update isCurrentUserTyping and timestamp', () => {
    act(() => {
      usePresenceStore.getState().setTyping(true);
    });
    
    const state = usePresenceStore.getState();
    expect(state.isCurrentUserTyping).toBe(true);
    expect(state.lastTypingTimestamp).not.toBeNull();
    
    // Should have called socket method (note: debounced, might not be called immediately)
    // Advance the timers to trigger the debounced function
    vi.advanceTimersByTime(500);
    expect(mockSocketSetTypingPresence).toHaveBeenCalledWith(true);
  });

  it('stopTypingAfterInactivity should reset typing status after timeout', () => {
    act(() => {
      // Set typing status
      usePresenceStore.getState().setTyping(true);
    });
    
    expect(usePresenceStore.getState().isCurrentUserTyping).toBe(true);
    
    // Advance time to just before timeout
    vi.advanceTimersByTime(2999);
    
    act(() => {
      // Check for inactivity
      usePresenceStore.getState().stopTypingAfterInactivity();
    });
    
    // Should still be typing
    expect(usePresenceStore.getState().isCurrentUserTyping).toBe(true);
    
    // Advance time past timeout
    vi.advanceTimersByTime(2);
    
    act(() => {
      // Check for inactivity again
      usePresenceStore.getState().stopTypingAfterInactivity();
    });
    
    // Should no longer be typing
    expect(usePresenceStore.getState().isCurrentUserTyping).toBe(false);

    // Should have called socket method (debounced)
    vi.advanceTimersByTime(500);
    expect(mockSocketSetTypingPresence).toHaveBeenCalledWith(false);
  });

  it('reset should clear the usersTyping array and reset typing status', () => {
    act(() => {
      usePresenceStore.getState().setUsersTyping([user1, user2]);
      usePresenceStore.getState().setTyping(true);
    });
    
    expect(usePresenceStore.getState().usersTyping.length).toBe(2);
    expect(usePresenceStore.getState().isCurrentUserTyping).toBe(true);

    act(() => {
      usePresenceStore.getState().reset();
    });
    
    const state = usePresenceStore.getState();
    expect(state.usersTyping).toEqual([]);
    expect(state.isCurrentUserTyping).toBe(false);
    expect(state.lastTypingTimestamp).toBeNull();
  });

  describe('selectors', () => {
    it('selectIsAnyoneTyping should return false when usersTyping is empty', () => {
      const isTyping = selectIsAnyoneTyping(usePresenceStore.getState());
      expect(isTyping).toBe(false);
    });

    it('selectIsAnyoneTyping should return true when usersTyping has users', () => {
      act(() => {
        usePresenceStore.getState().setUsersTyping([user1]);
      });
      const isTyping = selectIsAnyoneTyping(usePresenceStore.getState());
      expect(isTyping).toBe(true);
    });

    it('selectTypingUsers should return array of nicknames', () => {
      act(() => {
        usePresenceStore.getState().setUsersTyping([user1, user2]);
      });
      const typingUsers = selectTypingUsers(usePresenceStore.getState());
      expect(typingUsers).toEqual(['Alice', 'Bob']);
    });
  });
});
