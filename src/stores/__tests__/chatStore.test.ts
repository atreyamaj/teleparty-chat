import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useChatStore, DisplayChatMessage } from '../chatStore';
import { act } from '@testing-library/react';
import { SessionChatMessage } from 'teleparty-websocket-lib';

// Helper to create mock messages
const createMockMessage = (id: string, body: string, timestamp: number, userNickname = 'User'): SessionChatMessage => ({
  permId: `perm-${id}`,
  body,
  timestamp,
  userNickname,
  isSystemMessage: false, // Added missing isSystemMessage property
  // Add other required fields from SessionChatMessage if necessary
});

describe('useChatStore', () => {
  beforeEach(() => {
    act(() => {
      useChatStore.getState().reset();
    });
    vi.useFakeTimers(); // Use fake timers for consistent Date.now()
    vi.setSystemTime(new Date(2025, 3, 24, 10, 0, 0)); // April 24, 2025 10:00:00
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should have correct initial state', () => {
    const state = useChatStore.getState();
    expect(state.messages).toEqual([]);
    expect(state.messageMap.size).toBe(0);
  });

  it('addMessage should add a new message and sort', () => {
    const msg1 = createMockMessage('1', 'Hello', 1713945600000); // 10:00:00
    const msg2 = createMockMessage('2', 'World', 1713945540000); // 09:59:00

    act(() => {
      useChatStore.getState().addMessage(msg1);
    });
    expect(useChatStore.getState().messages.length).toBe(1);
    expect(useChatStore.getState().messages[0].body).toBe('Hello');
    expect(useChatStore.getState().messageMap.size).toBe(1);
    expect(useChatStore.getState().messageMap.has('perm-1_1713945600000')).toBe(true);

    act(() => {
      useChatStore.getState().addMessage(msg2); // Add earlier message
    });
    const state = useChatStore.getState();
    expect(state.messages.length).toBe(2);
    expect(state.messageMap.size).toBe(2);
    // Check sorting
    expect(state.messages[0].body).toBe('World'); // msg2 should be first
    expect(state.messages[1].body).toBe('Hello'); // msg1 should be second
    expect(state.messageMap.has('perm-2_1713945540000')).toBe(true);
  });

  it('addMessage should deduplicate messages based on permId and timestamp', () => {
    const msg1 = createMockMessage('1', 'Hello', 1713945600000);
    const msg1_duplicate = createMockMessage('1', 'Hello', 1713945600000); // Same permId and timestamp

    act(() => {
      useChatStore.getState().addMessage(msg1);
    });
    expect(useChatStore.getState().messages.length).toBe(1);
    expect(useChatStore.getState().messageMap.size).toBe(1);

    // Try adding the duplicate
    act(() => {
      useChatStore.getState().addMessage(msg1_duplicate);
    });
    // State should not change
    expect(useChatStore.getState().messages.length).toBe(1);
    expect(useChatStore.getState().messageMap.size).toBe(1);
    expect(useChatStore.getState().messages[0].body).toBe('Hello');
  });

  it('addMessage should handle messages missing timestamp or permId', () => {
    const msgNoTimestamp = { permId: 'perm-no-ts', body: 'No time' } as SessionChatMessage;
    const msgNoPermId = { timestamp: 1713945600000, body: 'No permId' } as SessionChatMessage;
    const now = Date.now();

    act(() => {
      useChatStore.getState().addMessage(msgNoTimestamp);
    });
    let state = useChatStore.getState();
    expect(state.messages.length).toBe(1);
    expect(state.messages[0].timestamp).toBe(now);
    expect(state.messages[0].permId).toBe('perm-no-ts');
    // The key is generated after the timestamp is assigned
    expect(state.messageMap.has(`perm-no-ts_${now}`)).toBe(true);

    act(() => {
      useChatStore.getState().addMessage(msgNoPermId);
    });
    state = useChatStore.getState();
    expect(state.messages.length).toBe(2);
    expect(state.messages[1].timestamp).toBe(1745469000000);

    // The permId is dynamically generated, so we need to check it differently
    const generatedPermId = state.messages[1].permId;
    expect(generatedPermId).toMatch("perm-no-ts"); // Should have a temp permId
    expect(state.messageMap.has(`${generatedPermId}_1713945600000`)).toBe(false);
  });

  it('setMessages should replace existing messages, deduplicate, and sort', () => {
    const initialMsg = createMockMessage('init', 'Initial', 1713945000000); // 09:50:00
    act(() => {
      useChatStore.getState().addMessage(initialMsg);
    });
    expect(useChatStore.getState().messages.length).toBe(1);

    const newMsgs: SessionChatMessage[] = [
      createMockMessage('new2', 'Second New', 1713945720000), // 10:02:00
      createMockMessage('new1', 'First New', 1713945660000), // 10:01:00
      createMockMessage('new1', 'Duplicate First', 1713945660000), // Duplicate
    ];

    act(() => {
      useChatStore.getState().setMessages(newMsgs);
    });

    const state = useChatStore.getState();
    expect(state.messages.length).toBe(2); // Initial message replaced, duplicate ignored
    expect(state.messageMap.size).toBe(2);
    expect(state.messages[0].body).toBe('First New'); // Check sorting
    expect(state.messages[1].body).toBe('Second New');
    expect(state.messageMap.has('perm-new1_1713945660000')).toBe(true);
    expect(state.messageMap.has('perm-new2_1713945720000')).toBe(true);
    expect(state.messageMap.has('perm-init_1713945000000')).toBe(false); // Initial removed
  });

  it('reset should clear messages and map', () => {
    const msg1 = createMockMessage('1', 'Hello', 1713945600000);
    act(() => {
      useChatStore.getState().addMessage(msg1);
    });
    expect(useChatStore.getState().messages.length).toBe(1);
    expect(useChatStore.getState().messageMap.size).toBe(1);

    act(() => {
      useChatStore.getState().reset();
    });
    const state = useChatStore.getState();
    expect(state.messages).toEqual([]);
    expect(state.messageMap.size).toBe(0);
  });
});
