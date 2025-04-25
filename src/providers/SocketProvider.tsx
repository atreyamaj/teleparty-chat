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
import { usePresenceStore, SocketInstanceActions } from "../stores/presenceStore";
import { useUserStore } from "../stores/userStore"; // Import useUserStore

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
  const lastCloseCodeRef = useRef<number | null>(null);
  const mountTimeRef = useRef<number>(Date.now());

  // Zustand store actions
  const setConnectionStatus = useRoomStore((state) => state.setConnectionStatus);
  const resetRoom = useRoomStore((state) => state.reset);
  const addMessage = useChatStore((state) => state.addMessage);
  const setMessages = useChatStore((state) => state.setMessages);
  const resetChat = useChatStore((state) => state.reset);
  const setUsersTyping = usePresenceStore((state) => state.setUsersTyping);
  const resetPresence = usePresenceStore((state) => state.reset);
  const setSocketInstance = usePresenceStore((state) => state.setSocketInstance);
  const setUserIcon = useUserStore((state) => state.setUserIcon); // Get setUserIcon from userStore

  // Helper functions - Define these first to avoid reference errors
  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const onMessage = useCallback((message: any) => {
    if (!isMountedRef.current) return;

    if (message.type !== SocketMessageTypes.SET_TYPING_PRESENCE) {
      console.debug("Received message:", message);
    }

    switch (message.type) {
      case SocketMessageTypes.SEND_MESSAGE: {
        const sessionMsg = message.data as SessionChatMessage;
        addMessage({
          content: sessionMsg.body || "",
          senderName: sessionMsg.userNickname || "Unknown User",
          senderId: sessionMsg.permId || "unknown-id",
          isSystemMessage: sessionMsg.isSystemMessage || false,
        });
        break;
      }
      case SocketMessageTypes.JOIN_SESSION:
        console.log("User list update:", message.data?.users);
        break;
      case SocketMessageTypes.SET_TYPING_PRESENCE:
        if (message.data && message.data.usersTyping) {
          setUsersTyping(message.data.usersTyping || []);
        }
        break;
      case "userId":
        console.log("Received userId from server:", message.data);
        break;
      default:
        console.log("Received message of type:", message.type, "with data:", message.data);
    }
  }, [addMessage, setUsersTyping, isMountedRef]);
  
  let connect: () => void;

  const shouldReconnect = useCallback((code: number | null) => {
    if (code === 1000 || code === 1001) {
      return false;
    }

    if (connectionReadyResolversRef.current.length > 0) {
      console.log("Not reconnecting because there are pending operations");
      return false;
    }

    const hasBeenMountedLongEnough = (Date.now() - mountTimeRef.current) > 5000;

    return hasBeenMountedLongEnough && !explicitTeardownRef.current;
  }, []);

  const onClose = useCallback((event?: CloseEvent) => {
    const closeCode = event ? event.code : null;
    lastCloseCodeRef.current = closeCode;

    console.log(`WebSocket connection closed. Code: ${closeCode}`);

    if (!isMountedRef.current) {
      clientRef.current = null;
      return;
    }

    const currentIsConnected = clientRef.current !== null && isConnected;
    const currentIsConnecting = isConnecting;

    if (!currentIsConnected && !currentIsConnecting) {
      console.log("Ignoring close event as we're not in connected/connecting state");
      return;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setConnectionStatus("disconnected");

    connectionReadyResolversRef.current.forEach((resolve) => resolve(false));
    connectionReadyResolversRef.current = [];

    if (shouldReconnect(closeCode) && !explicitTeardownRef.current) {
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(
          INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current),
          MAX_RECONNECT_DELAY
        );
        console.log(
          `Attempting reconnect in ${delay}ms... (Attempt ${
            reconnectAttemptsRef.current + 1
          }/${MAX_RECONNECT_ATTEMPTS})`
        );

        clearReconnectTimer();
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current && !explicitTeardownRef.current) {
            reconnectAttemptsRef.current++;
            clientRef.current = null;
            connect();
          }
        }, delay);
      } else {
        console.error("Max reconnect attempts reached.");
        setError("Connection failed after multiple attempts.");
        setConnectionStatus("error");
        clientRef.current = null;
      }
    } else {
      console.log(`Not reconnecting. Should reconnect: ${shouldReconnect(closeCode)}, Explicit teardown: ${explicitTeardownRef.current}`);
      clientRef.current = null;
    }
  }, [shouldReconnect, setConnectionStatus, setIsConnected, setIsConnecting, setError, clearReconnectTimer, isConnected, isConnecting]);

  connect = useCallback(() => {
    if (clientRef.current || isConnecting) {
      console.log("Connection attempt already in progress or established.");
      return;
    }

    explicitTeardownRef.current = false;

    console.log("Attempting to connect WebSocket...");
    setIsConnecting(true);
    setError(null);
    setConnectionStatus("connecting");

    const connectionAttemptId = Date.now();
    const connectionAttemptRef = { valid: true, id: connectionAttemptId };

    setTimeout(() => {
      if (!isMountedRef.current || !connectionAttemptRef.valid) {
        console.log("Connection attempt aborted: component unmounted or attempt invalidated");
        return;
      }

      if (clientRef.current) {
        console.log("Client already exists, aborting new connection attempt");
        setIsConnecting(false);
        return;
      }

      const eventHandler: SocketEventHandler = {
        onConnectionReady: () => {
          if (!isMountedRef.current) return;
          
          if (!connectionAttemptRef.valid) {
            console.log("Connection ready for invalidated attempt, ignoring");
            return;
          }
          
          console.log("WebSocket connection established.");
          setIsConnected(true);
          setIsConnecting(false);
          setError(null);
          setConnectionStatus("connected");
          reconnectAttemptsRef.current = 0;
          clearReconnectTimer();
          lastCloseCodeRef.current = null;

          connectionReadyResolversRef.current.forEach((resolve) => resolve(true));
          connectionReadyResolversRef.current = [];

          const socketInstanceActions: SocketInstanceActions = {
            setTypingPresence: (typing: boolean): void => {
              if (clientRef.current) {
                clientRef.current.sendMessage(SocketMessageTypes.SET_TYPING_PRESENCE, { typing });
              }
            }
          };
          setSocketInstance(socketInstanceActions);
        },
        onClose: (event?: CloseEvent) => {
          if (isMountedRef.current && connectionAttemptRef.valid) {
            onClose(event);
          } else {
            console.log("Ignoring close event for invalidated connection attempt");
          }
        },
        onMessage: onMessage,
      };

      try {
        clearReconnectTimer();
        
        if (!clientRef.current && connectionAttemptRef.valid && isMountedRef.current) {
          clientRef.current = new TelepartyClient(eventHandler);
        }
      } catch (err) {
        console.error("Failed to initialize TelepartyClient:", err);
        
        if (isMountedRef.current && connectionAttemptRef.valid) {
          setError("Failed to initialize connection.");
          setIsConnecting(false);
          setConnectionStatus("error");
          clientRef.current = null;

          connectionReadyResolversRef.current.forEach((resolve) => resolve(false));
          connectionReadyResolversRef.current = [];
        }
      }
    }, 150);
    
    return () => {
      connectionAttemptRef.valid = false;
    };
  }, [isConnecting, setConnectionStatus, onMessage, clearReconnectTimer, setSocketInstance, setIsConnected, setIsConnecting, setError, onClose]);

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

      const cleanupTimeout = () => clearTimeout(timeoutId);
      return cleanupTimeout;
    });
  }, [isConnected, error]);

  const teardownWithoutReset = useCallback(() => {
    if (!explicitTeardownRef.current) {
      console.log("Closing WebSocket connection without reset...");
    }

    explicitTeardownRef.current = true;

    clearReconnectTimer();

    if (clientRef.current) {
      const client = clientRef.current;
      
      clientRef.current = null;
      
      if (isMountedRef.current) {
        setIsConnected(false);
        setIsConnecting(false);
      }
      
      client.teardown();
    } else if (isMountedRef.current) {
      setIsConnected(false);
      setIsConnecting(false);
    }

    if (isMountedRef.current) {
      setError(null);
    }

    connectionReadyResolversRef.current.forEach((resolve) => resolve(false));
    connectionReadyResolversRef.current = [];
  }, [clearReconnectTimer]);

  const teardown = useCallback(() => {
    console.log("Tearing down WebSocket connection with reset...");
    
    explicitTeardownRef.current = true;

    clearReconnectTimer();

    if (clientRef.current) {
      const client = clientRef.current;
      
      clientRef.current = null;
      
      if (isMountedRef.current) {
        setIsConnected(false);
        setIsConnecting(false);
        setError(null);
        
        resetRoom();
        resetChat();
        resetPresence();
      }
      
      client.teardown();
    } else if (isMountedRef.current) {
      setIsConnected(false);
      setIsConnecting(false);
      setError(null);
      
      resetRoom();
      resetChat();
      resetPresence();
    }

    connectionReadyResolversRef.current.forEach((resolve) => resolve(false));
    connectionReadyResolversRef.current = [];
  }, [clearReconnectTimer, resetRoom, resetChat, resetPresence]);

  useEffect(() => {
    isMountedRef.current = true;
    mountTimeRef.current = Date.now();
    
    const connectTimer = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      if (!explicitTeardownRef.current && !clientRef.current) {
        console.log("Initial connection setup");
        connect();
      }
    }, 300);
    
    return () => {
      clearTimeout(connectTimer);
      
      console.log("SocketProvider unmounting, performing cleanup");
      isMountedRef.current = false;
      
      if (clientRef.current) {
        teardownWithoutReset();
      }
    };
  }, []);

  const ensureConnected = useCallback(async () => {
    if (clientRef.current && isConnected) {
      return clientRef.current;
    }

    if (isConnecting) {
      console.log("Connection attempt already in progress, waiting for it to complete...");
      try {
        const success = await waitForConnection();
        if (success && clientRef.current) {
          return clientRef.current;
        }
      } catch (err) {
        console.error("Error while waiting for connection:", err);
      }
    }

    console.log("No active connection, starting a new one...");
    
    setError(null);
    
    if (clientRef.current) {
      const client = clientRef.current;
      clientRef.current = null;
      try {
        client.teardown();
      } catch (e) {
        console.warn("Error when tearing down stale client:", e);
      }
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    explicitTeardownRef.current = false;
    
    connect();
    
    try {
      const success = await Promise.race([
        waitForConnection(),
        new Promise<boolean>((_, reject) => 
          setTimeout(() => reject(new Error("Connection timed out")), CONNECTION_TIMEOUT)
        )
      ]);
      
      if (success && clientRef.current) {
        return clientRef.current;
      }
    } catch (err) {
      console.error("Connection failed:", err);
      if (clientRef.current) {
        // Cast client to TelepartyClient to avoid 'never' type issue
        const client = clientRef.current as TelepartyClient;
        clientRef.current = null;
        try {
          client.teardown();
        } catch (e) {
          console.warn("Error tearing down client after connection failure:", e);
        }
      }
      
      throw new Error(err instanceof Error ? err.message : "WebSocket connection failed");
    }

    // Throw error if connection wasn't established
    throw new Error("WebSocket is not connected. Please try again.");
  }, [isConnected, isConnecting, connect, waitForConnection, setError]);

  const createRoom = useCallback(
    async (nickname: string, userIcon?: string): Promise<string> => {
      const client = await ensureConnected();
      if (!client) {
        throw new Error("Connection isn't Ready yet.");
      }

      if (userIcon) {
        setUserIcon(userIcon);
      }

      console.log(`SocketProvider: Attempting to create room for ${nickname}`);
      try {
        const newRoomId = await client.createChatRoom(nickname, userIcon);
        console.log(`SocketProvider: Created room ${newRoomId}`);

        return newRoomId;
      } catch (error) {
        console.error(`SocketProvider: Error creating room:`, error);
        throw error;
      }
    },
    [ensureConnected, setUserIcon]
  );

  const joinRoom = useCallback(
    async (
      nickname: string,
      roomId: string,
      userIcon?: string,
    ): Promise<MessageList> => {
      const client = await ensureConnected();
      if (!client) {
        throw new Error("Connection isn't Ready yet.");
      }

      if (userIcon) {
        setUserIcon(userIcon);
      }

      console.log(`SocketProvider: Attempting to join room ${roomId} via client`);

      try {
        const messageHistory = await client.joinChatRoom(nickname, roomId, userIcon);
        console.log(`SocketProvider: Successfully joined room ${roomId}`);

        setMessages(messageHistory.messages);

        return messageHistory;
      } catch (error) {
        console.error(`SocketProvider: Error joining room ${roomId}:`, error);
        throw error;
      }
    },
    [ensureConnected, setUserIcon, setMessages]
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
