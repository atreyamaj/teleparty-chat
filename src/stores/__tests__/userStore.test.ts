import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useUserStore } from '../userStore';
import { act } from '@testing-library/react';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    })
  };
})();

describe('useUserStore', () => {
  beforeEach(() => {
    // Setup localStorage mock before each test
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    
    // Reset the store for each test
    act(() => {
      useUserStore.getState().reset();
    });
    
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should have correct initial state', () => {
    const state = useUserStore.getState();
    expect(state.userIcon).toBeNull();
  });

  it('setUserIcon should update userIcon', () => {
    const testIcon = 'data:image/png;base64,testbase64data';
    
    act(() => {
      useUserStore.getState().setUserIcon(testIcon);
    });
    
    expect(useUserStore.getState().userIcon).toBe(testIcon);
  });

  it('reset should clear the userIcon', () => {
    const testIcon = 'data:image/png;base64,testbase64data';
    
    act(() => {
      useUserStore.getState().setUserIcon(testIcon);
    });

    expect(useUserStore.getState().userIcon).toBe(testIcon);
    
    act(() => {
      useUserStore.getState().reset();
    });
    
    expect(useUserStore.getState().userIcon).toBeNull();
  });

  it('should persist userIcon to localStorage', async () => {
    const testIcon = 'data:image/png;base64,testbase64data';

    // Act - Set the icon
    await act(async () => {
      useUserStore.getState().setUserIcon(testIcon);
    });
    
    // We need this small delay to ensure the persist middleware has time to call localStorage
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Assert - Check if localStorage was called
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
    
    // The exact storage key and format depends on zustand/persist implementation
    // Let's check if any call includes our storage key
    const storageKey = 'teleparty-user-store';
    const wasStorageKeyCalled = mockLocalStorage.setItem.mock.calls.some(
      call => call[0] === storageKey
    );
    
    expect(wasStorageKeyCalled).toBe(true);
  });
});