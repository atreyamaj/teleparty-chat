import { render, screen, act, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { SocketProvider, useSocket } from "../SocketProvider";
import { TelepartyClient, SocketEventHandler, SocketMessageTypes, MessageList, SessionChatMessage } from "teleparty-websocket-lib";
import { useRoomStore } from "../../stores/roomStore";
import { useChatStore } from "../../stores/chatStore";
import { usePresenceStore } from "../../stores/presenceStore";

// --- Mocks ---
vi.mock("teleparty-websocket-lib");
vi.mock("../../stores/roomStore");
vi.mock("../../stores/chatStore");
vi.mock("../../stores/presenceStore");

// Mock Zustand store return values
const mockSetConnectionStatus = vi.fn();
const mockSetRoomDetails = vi.fn();
const mockResetRoom = vi.fn();
const mockAddMessage = vi.fn();
const mockSetMessages = vi.fn();
const mockResetChat = vi.fn();
const mockSetUsersTyping = vi.fn();
const mockResetPresence = vi.fn();

// Mock TelepartyClient instance methods
const mockCreateChatRoom = vi.fn();
const mockJoinChatRoom = vi.fn();
const mockSendMessage = vi.fn();
const mockTeardown = vi.fn();

let mockEventHandler: SocketEventHandler | null = null;

const MockTelepartyClient = vi.fn().mockImplementation((eventHandler: SocketEventHandler) => {
  mockEventHandler = eventHandler; // Capture the event handler
  return {
    createChatRoom: mockCreateChatRoom,
    joinChatRoom: mockJoinChatRoom,
    sendMessage: mockSendMessage,
    teardown: mockTeardown,
  };
});

// --- Test Component ---
const TestComponent = () => {
  const socket = useSocket();
  return (
    <div>
      <span data-testid="connected">{socket.isConnected.toString()}</span>
      <span data-testid="connecting">{socket.isConnecting.toString()}</span>
      <span data-testid="error">{socket.error || "null"}</span>
      <button onClick={() => socket.createRoom("TestUser")}>Create</button>
      <button onClick={() => socket.joinRoom("TestUser", "room123")}>Join</button>
      <button onClick={() => socket.sendChat("Hello")}>Send</button>
      <button onClick={() => socket.setTypingPresence(true)}>Typing</button>
    </div>
  );
};

// --- Test Suite ---
describe("SocketProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    
    // Reset mocks before each test
    vi.clearAllMocks();

    // Setup mock store returns
    (useRoomStore as any).mockImplementation((selector: any) => selector({
      setConnectionStatus: mockSetConnectionStatus,
      setRoomDetails: mockSetRoomDetails,
      reset: mockResetRoom,
    }));
    
    (useChatStore as any).mockImplementation((selector: any) => selector({
      addMessage: mockAddMessage,
      setMessages: mockSetMessages,
      reset: mockResetChat,
    }));
    
    (usePresenceStore as any).mockImplementation((selector: any) => selector({
      setUsersTyping: mockSetUsersTyping,
      reset: mockResetPresence,
    }));

    // Correctly mock the TelepartyClient implementation
    vi.mocked(TelepartyClient).mockImplementation(MockTelepartyClient);

    // Reset event handler capture
    mockEventHandler = null;
  });

  afterEach(() => {
    // Run all pending timers to completion and reset timer mocks
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("initializes connection on mount", () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    expect(MockTelepartyClient).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("connecting").textContent).toBe("true");
    expect(mockSetConnectionStatus).toHaveBeenCalledWith("connecting");
  });

  it("updates state when connection is ready", () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    expect(mockEventHandler).not.toBeNull();
    act(() => {
      mockEventHandler?.onConnectionReady();
    });

    expect(screen.getByTestId("connected").textContent).toBe("true");
    expect(screen.getByTestId("connecting").textContent).toBe("false");
    expect(mockSetConnectionStatus).toHaveBeenCalledWith("connected");
  });

  it("handles createRoom call", async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Simulate connection ready
    act(() => {
      mockEventHandler?.onConnectionReady();
    });

    mockCreateChatRoom.mockResolvedValue("new-room-id");

    const createButton = screen.getByText("Create");
    
    await act(async () => {
      createButton.click();
      // Flush all pending promises
      await Promise.resolve();
    });

    expect(mockCreateChatRoom).toHaveBeenCalledWith("TestUser", undefined);
    expect(mockSetRoomDetails).toHaveBeenCalledWith("new-room-id", "TestUser");
  });

  it("handles joinRoom call", async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );
    
    // Simulate connection ready
    act(() => { 
      mockEventHandler?.onConnectionReady(); 
    });

    const mockMessages: SessionChatMessage[] = [{ permId: "m1", body: "Hi", timestamp: 123, isSystemMessage: false }];
    const mockHistory: MessageList = { messages: mockMessages };
    mockJoinChatRoom.mockResolvedValue(mockHistory);

    const joinButton = screen.getByText("Join");
    
    await act(async () => {
      joinButton.click();
      // Flush all pending promises
      await Promise.resolve();
    });

    expect(mockJoinChatRoom).toHaveBeenCalledWith("TestUser", "room123", undefined);
    expect(mockSetRoomDetails).toHaveBeenCalledWith("room123", "TestUser");
    expect(mockSetMessages).toHaveBeenCalledWith(mockHistory.messages);
  });

  it("handles sendChat call", () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );
    
    // Simulate connection ready
    act(() => { 
      mockEventHandler?.onConnectionReady(); 
    });

    const sendButton = screen.getByText("Send");
    act(() => {
      sendButton.click();
    });

    expect(mockSendMessage).toHaveBeenCalledWith(SocketMessageTypes.SEND_MESSAGE, { body: "Hello" });
  });

  it("handles setTypingPresence call", () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );
    
    // Simulate connection ready
    act(() => { 
      mockEventHandler?.onConnectionReady(); 
    });

    const typingButton = screen.getByText("Typing");
    act(() => {
      typingButton.click();
    });

    expect(mockSendMessage).toHaveBeenCalledWith(SocketMessageTypes.SET_TYPING_PRESENCE, { typing: true });
  });

  it("handles incoming SEND_MESSAGE", () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );
    
    // Simulate connection ready
    act(() => { 
      mockEventHandler?.onConnectionReady(); 
    });

    const newMessage: SessionChatMessage = { permId: "m2", body: "There", timestamp: 456, isSystemMessage: false };
    act(() => {
      mockEventHandler?.onMessage({ type: SocketMessageTypes.SEND_MESSAGE, data: newMessage });
    });

    expect(mockAddMessage).toHaveBeenCalledWith(newMessage);
  });

  it("handles incoming typing presence updates", () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );
    
    // Simulate connection ready
    act(() => { 
      mockEventHandler?.onConnectionReady(); 
    });

    const typingUsers = [{ nickname: "TypingUser", userId: "user1" }];
    act(() => {
      mockEventHandler?.onMessage({ 
        type: SocketMessageTypes.SET_TYPING_PRESENCE, 
        data: { usersTyping: typingUsers } 
      });
    });

    expect(mockSetUsersTyping).toHaveBeenCalledWith(typingUsers);
  });

  it("attempts reconnection on close", () => {
    // Render and connect
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );
    
    // Initial connection
    act(() => { 
      mockEventHandler?.onConnectionReady(); 
    });

    expect(screen.getByTestId("connected").textContent).toBe("true");

    // Mock implementation reset to track new calls
    MockTelepartyClient.mockClear();
    
    // Simulate disconnect
    act(() => {
      mockEventHandler?.onClose();
      // Immediately advance past the reconnect delay in one act call
      vi.advanceTimersByTime(1000); // INITIAL_RECONNECT_DELAY
    });

    expect(screen.getByTestId("connected").textContent).toBe("false");
    expect(mockSetConnectionStatus).toHaveBeenCalledWith("disconnected");
    expect(MockTelepartyClient).toHaveBeenCalledTimes(1); // New client created
  });

  it("stops reconnecting after max attempts", () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );
    
    // Initial connection
    act(() => { 
      mockEventHandler?.onConnectionReady(); 
    });
    
    // Reset mock to track new calls
    MockTelepartyClient.mockClear();
    
    // Simulate max reconnect attempts
    for (let i = 0; i < 5; i++) {
      act(() => {
        // Simulate disconnect
        const currentHandler = mockEventHandler;
        
        // Calculate the expected delay for this reconnection attempt
        const delay = 1000 * Math.pow(2, i);
        
        // Trigger onClose which schedules the reconnect
        currentHandler?.onClose();
        
        // Fast-forward past the scheduled reconnect
        vi.advanceTimersByTime(delay);
      });
    }
    
    expect(MockTelepartyClient).toHaveBeenCalledTimes(5);
    
    // After 5 attempts, one more disconnect should set error state
    act(() => {
      mockEventHandler?.onClose();
      vi.runAllTimers(); // Make sure any remaining timers are executed
    });
    
    expect(mockSetConnectionStatus).toHaveBeenCalledWith("error");
    expect(screen.getByTestId("error").textContent).toContain("Connection failed after multiple attempts");
  });

  it("calls teardown on unmount", () => {
    const { unmount } = render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );
    
    // Connect first
    act(() => { 
      mockEventHandler?.onConnectionReady(); 
    });

    // Unmount the component
    act(() => {
      unmount();
      // Run any timers that might have been set during unmount
      vi.runAllTimers();
    });

    expect(mockTeardown).toHaveBeenCalledTimes(1);
    expect(mockResetRoom).toHaveBeenCalled();
    expect(mockResetChat).toHaveBeenCalled();
    expect(mockResetPresence).toHaveBeenCalled();
  });
});
