import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  TelepartyClient,
  SocketEventHandler,
  SocketMessageTypes,
  MessageList,
  SessionChatMessage, // Assuming this type exists based on docs
} from "teleparty-websocket-lib";
import { useRoomStore } from "../stores/roomStore";
import { useChatStore } from "../stores/chatStore";
import { usePresenceStore } from "../stores/presenceStore";

// Define the shape of the context data
interface SocketContextType {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  createRoom: (nickname: string, userIcon?: string) => Promise<string>;
  joinRoom: (
    nickname: string,
    roomId: string,
    userIcon?: string,
  ) => Promise<MessageList>;
  sendChat: (body: string) => void;
  setTypingPresence: (typing: boolean) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY = 1000; // 1 second
const MAX_RECONNECT_DELAY = 30000; // 30 seconds
const CONNECTION_TIMEOUT = 10000; // 10 seconds timeout for connection attempts

export const SocketProvider: React.FC<SocketProviderProps> = ({
  children,
}) => {
  const clientRef = useRef<TelepartyClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectionReadyResolversRef = useRef<Array<(value: boolean) => void>>([]);
  const explicitTeardownRef = useRef(false);
  const isMountedRef = useRef(true);

  // Zustand store actions
  const setConnectionStatus = useRoomStore((state) => state.setConnectionStatus);
  const setRoomDetails = useRoomStore((state) => state.setRoomDetails);
  const resetRoom = useRoomStore((state) => state.reset);
  const addMessage = useChatStore((state) => state.addMessage);
  const setMessages = useChatStore((state) => state.setMessages);
  const resetChat = useChatStore((state) => state.reset);
  const setUsersTyping = usePresenceStore((state) => state.setUsersTyping);
  const resetPresence = usePresenceStore((state) => state.reset);
  const setSocketInstance = usePresenceStore((state) => state.setSocketInstance);

  // Function to wait for connection to be ready
  const waitForConnection = useCallback((): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      if (isConnected && clientRef.current) {
        resolve(true);
        return;
      }

      if (error) {
        reject(new Error(error));
        return;
      }

      connectionReadyResolversRef.current.push(resolve);

      const timeoutId = setTimeout(() => {
        connectionReadyResolversRef.current = connectionReadyResolversRef.current.filter(
          (r) => r !== resolve,
        );
        reject(new Error("Connection timeout"));
      }, CONNECTION_TIMEOUT);

      return () => clearTimeout(timeoutId);
    });
  }, [isConnected, error]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (clientRef.current || isConnecting) {
      console.log("Connection attempt already in progress or established.");
      return;
    }

    explicitTeardownRef.current = false;

    console.log("Attempting to connect WebSocket...");
    setIsConnecting(true);
    setError(null);
    setConnectionStatus("connecting");

    const eventHandler: SocketEventHandler = {
      onConnectionReady: () => {
        if (!isMountedRef.current) return;

        console.log("WebSocket connection established.");
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        setConnectionStatus("connected");
        reconnectAttemptsRef.current = 0;
        clearReconnectTimer();

        connectionReadyResolversRef.current.forEach((resolve) => resolve(true));
        connectionReadyResolversRef.current = [];

        // Define the type for the object passed to setSocketInstance
        interface SocketInstanceActions {
          setTypingPresence: (typing: boolean) => void;
        }

        const socketInstanceActions: SocketInstanceActions = {
          setTypingPresence: (typing: boolean): void => {
            if (clientRef.current) {
              // Assuming sendMessage expects a payload matching the message type's requirements
              clientRef.current.sendMessage(SocketMessageTypes.SET_TYPING_PRESENCE, { typing });
            }
          }
        };
        // Assuming setSocketInstance from usePresenceStore expects an object of type SocketInstanceActions
        setSocketInstance(socketInstanceActions);
      },
      onClose: () => {
        console.log("WebSocket connection closed.");

        if (!isMountedRef.current) {
          clientRef.current = null;
          return;
        }

        setIsConnected(false);
        setIsConnecting(false);
        setConnectionStatus("disconnected");

        connectionReadyResolversRef.current.forEach((resolve) =>
          resolve(false),
        );
        connectionReadyResolversRef.current = [];

        if (!explicitTeardownRef.current) {
          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(
              INITIAL_RECONNECT_DELAY *
                Math.pow(2, reconnectAttemptsRef.current),
              MAX_RECONNECT_DELAY,
            );
            console.log(
              `Attempting reconnect in ${delay}ms... (Attempt ${
                reconnectAttemptsRef.current + 1
              })`,
            );
            reconnectTimeoutRef.current = setTimeout(() => {
              if (isMountedRef.current) {
                reconnectAttemptsRef.current++;
                clientRef.current = null;
                connect();
              }
            }, delay);
          } else {
            console.error("Max reconnect attempts reached.");
            setError("Connection failed after multiple attempts.");
            setConnectionStatus("error");
          }
        } else {
          clientRef.current = null;
        }
      },
      onMessage: (message) => {
        if (!isMountedRef.current) return;

        console.log("Received message:", message);
        switch (message.type) {
          case SocketMessageTypes.SEND_MESSAGE:
            addMessage(message.data as SessionChatMessage);
            break;
          case SocketMessageTypes.JOIN_SESSION:
            console.log("User list update:", message.data?.users);
            break;
          case SocketMessageTypes.SET_TYPING_PRESENCE:
            if (message.data && message.data.usersTyping) {
              setUsersTyping(message.data.usersTyping || []);
            }
            break;
          default:
            console.warn("Unhandled message type:", message.type);
        }
      },
    };

    try {
      clearReconnectTimer();
      clientRef.current = new TelepartyClient(eventHandler);
    } catch (err) {
      console.error("Failed to initialize TelepartyClient:", err);
      setError("Failed to initialize connection.");
      setIsConnecting(false);
      setConnectionStatus("error");
      clientRef.current = null;

      connectionReadyResolversRef.current.forEach((resolve) =>
        resolve(false),
      );
      connectionReadyResolversRef.current = [];
    }
  }, [isConnecting, setConnectionStatus, addMessage, setUsersTyping, clearReconnectTimer, setSocketInstance]);

  const teardownWithoutReset = useCallback(() => {
    if (!explicitTeardownRef.current) {
      console.log("Closing WebSocket connection...");
    }

    explicitTeardownRef.current = true;

    clearReconnectTimer();

    if (clientRef.current) {
      clientRef.current.teardown();
      clientRef.current = null;
    }

    if (isMountedRef.current) {
      setIsConnected(false);
      setIsConnecting(false);
      setError(null);
    }

    connectionReadyResolversRef.current.forEach((resolve) =>
      resolve(false),
    );
    connectionReadyResolversRef.current = [];
  }, [clearReconnectTimer]);

  const teardown = useCallback(() => {
    console.log("Tearing down WebSocket connection...");
    explicitTeardownRef.current = true;

    clearReconnectTimer();

    if (clientRef.current) {
      clientRef.current.teardown();
      clientRef.current = null;
    }

    if (isMountedRef.current) {
      setIsConnected(false);
      setIsConnecting(false);
      setError(null);

      resetRoom();
      resetChat();
      resetPresence();
    }

    connectionReadyResolversRef.current.forEach((resolve) =>
      resolve(false),
    );
    connectionReadyResolversRef.current = [];
  }, [clearReconnectTimer, resetRoom, resetChat, resetPresence]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      teardownWithoutReset();
    };
  }, [connect, teardownWithoutReset]);

  const ensureConnected = useCallback(async () => {
    if (clientRef.current && isConnected) {
      return clientRef.current;
    }

    if (!clientRef.current && !isConnecting) {
      connect();
    }

    const success = await waitForConnection();
    if (success && clientRef.current) {
      return clientRef.current;
    }

    throw new Error("WebSocket is not connected. Please try again.");
  }, [isConnected, isConnecting, connect, waitForConnection]);

  const createRoom = useCallback(
    async (nickname: string, userIcon?: string): Promise<string> => {
      try {
        const client = await ensureConnected();
        const roomId = await client.createChatRoom(nickname, userIcon);
        setRoomDetails(roomId, nickname);
        console.log("Created room:", roomId);
        return roomId;
      } catch (err) {
        console.error("Error creating room:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create room.";
        setError(errorMessage);
        throw err;
      }
    },
    [ensureConnected, setRoomDetails],
  );

  const joinRoom = useCallback(
    async (
      nickname: string,
      roomId: string,
      userIcon?: string,
    ): Promise<MessageList> => {
      try {
        const client = await ensureConnected();
        const messageHistory = await client.joinChatRoom(
          nickname,
          roomId,
          userIcon,
        );
        setRoomDetails(roomId, nickname);
        setMessages(messageHistory.messages);
        console.log("Joined room:", roomId);
        return messageHistory;
      } catch (err) {
        console.error("Error joining room:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to join room.";
        setError(errorMessage);
        throw err;
      }
    },
    [ensureConnected, setRoomDetails, setMessages],
  );

  const sendChat = useCallback(
    async (body: string) => {
      try {
        const client = await ensureConnected();
        client.sendMessage(SocketMessageTypes.SEND_MESSAGE, { body });
      } catch (err) {
        console.error("Error sending chat message:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to send message.";
        setError(errorMessage);
      }
    },
    [ensureConnected],
  );

  const setTypingPresence = useCallback(
    async (typing: boolean) => {
      try {
        const client = await ensureConnected();
        client.sendMessage(SocketMessageTypes.SET_TYPING_PRESENCE, { typing });
      } catch (err) {
        console.error("Error setting typing presence:", err);
      }
    },
    [ensureConnected],
  );

  const contextValue: SocketContextType = {
    isConnected,
    isConnecting,
    error,
    createRoom,
    joinRoom,
    sendChat,
    setTypingPresence,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
