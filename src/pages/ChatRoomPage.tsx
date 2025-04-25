import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Box, Paper, Alert, Snackbar, CircularProgress, Typography } from '@mui/material';
import ChatHeader from '../components/chat/ChatHeader';
import MessageList, { Message } from '../components/chat/MessageList';
import MessageInputBar from '../components/chat/MessageInputBar';
import { useRoomStore } from '../stores/roomStore';
import { useUserStore } from '../stores/userStore';
import { usePresenceStore, selectTypingUserNicknames } from '../stores/presenceStore';
import TypingIndicator from '../components/chat/TypingIndicator';
import { useSocket } from '../providers/SocketProvider';
import { v4 as uuidv4 } from 'uuid';
import { SessionChatMessage } from 'teleparty-websocket-lib';
import { shallow } from 'zustand/shallow';

interface ChatLocationState {
  justCreated?: boolean;
}

export const ChatRoomPage: React.FC = () => {
  const { id: roomId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as ChatLocationState | null;
  const justCreated = locationState?.justCreated || false;
  const nickname = useRoomStore(state => state.nickname);
  const connectionStatus = useRoomStore(state => state.connectionStatus);
  const connectionError = useRoomStore(state => state.connectionError);
  const userIcon = useUserStore(state => state.userIcon);
  const typingUserNicknames = usePresenceStore(selectTypingUserNicknames);
  const setTyping = usePresenceStore(state => state.setTyping);
  const socket = useSocket();
  const socketRef = useRef(socket);
  const joinedRoomRef = useRef<string | null>(justCreated ? roomId : null);
  const joiningAttemptInProgressRef = useRef(false);
  const navigatedAwayRef = useRef(false);
  const initialCheckPerformedRef = useRef(false);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [userId] = useState(() => uuidv4());
  const [hasRedirected, setHasRedirected] = useState(false);
  useEffect(() => {
    if (!nickname && !hasRedirected) {
      setHasRedirected(true);
      navigate('/', { state: { roomId } });
    }
  }, [nickname, hasRedirected, navigate, roomId]);
  if (!nickname) {
    return null;
  }
  if (navigatedAwayRef.current) {
    return null;
  }
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);
  useEffect(() => {
    if (navigatedAwayRef.current) return;
    if (!roomId) {
      navigatedAwayRef.current = true;
      navigate('/');
      return;
    }
    if (!nickname) {
      navigatedAwayRef.current = true;
      navigate('/', { state: { roomId } });
      return;
    }
    initialCheckPerformedRef.current = true;
    if (justCreated) {
      setMessages([
        {
          id: uuidv4(),
          text: `Welcome to the chat room!`,
          sender: {
            id: 'system',
            name: 'System',
          },
          timestamp: new Date(),
          isSystemMessage: true
        }
      ]);
    } else if (socketRef.current.isConnected && joinedRoomRef.current !== roomId) {
      joinChatRoom();
    }
    return () => {
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
        }
    };
  }, [roomId, nickname, navigate, justCreated]);
  useEffect(() => {
    if (!initialCheckPerformedRef.current || navigatedAwayRef.current || justCreated || joinedRoomRef.current === roomId || joiningAttemptInProgressRef.current) {
      return;
    }
    if (socketRef.current.isConnected) {
      joinChatRoom();
    }
  }, [socketRef.current.isConnected, justCreated, roomId]);
  const joinChatRoom = useCallback(async () => {
    const currentSocket = socketRef.current;
    if (!roomId || !nickname || !currentSocket.isConnected) {
      return;
    }
    if (joiningAttemptInProgressRef.current || joinedRoomRef.current === roomId) {
      return;
    }
    joiningAttemptInProgressRef.current = true;
    setIsJoining(true);
    setJoinError(null);
    try {
      const messageHistory = await currentSocket.joinRoom(
        nickname,
        roomId,
        userIcon || undefined
      );
      joinedRoomRef.current = roomId;
      const historyMessages: Message[] = Array.isArray(messageHistory.messages) ? 
        messageHistory.messages.map((msg: SessionChatMessage) => ({
          id: msg.permId || uuidv4(),
          text: msg.body || '',
          sender: {
            id: msg.permId || 'unknown',
            name: msg.userNickname || 'Unknown User',
          },
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          isSystemMessage: msg.isSystemMessage || false
        })) : [];
      if (historyMessages.length === 0) {
        historyMessages.push({
          id: uuidv4(),
          text: `Welcome to the chat room!`,
          sender: {
            id: 'system',
            name: 'System',
          },
          timestamp: new Date(),
          isSystemMessage: true
        });
      }
      if (!navigatedAwayRef.current) {
        setMessages(historyMessages);
      }
    } catch (err) {
      if (!navigatedAwayRef.current) {
        setJoinError(err instanceof Error ? err.message : 'Failed to join chat room');
        const errorMsg = err instanceof Error ? err.message : '';
        if (errorMsg.includes('not found') || errorMsg.includes('invalid')) {
          if (redirectTimeoutRef.current) {
            clearTimeout(redirectTimeoutRef.current);
          }
          redirectTimeoutRef.current = setTimeout(() => {
            if (!navigatedAwayRef.current) {
              navigatedAwayRef.current = true;
              navigate('/', { state: { roomId } });
            }
          }, 2000);
        }
      }
      joinedRoomRef.current = null;
    } finally {
      if (!navigatedAwayRef.current) {
        joiningAttemptInProgressRef.current = false;
        setIsJoining(false);
      }
    }
  }, [roomId, nickname, navigate, userIcon]);
  const handleSendMessage = useCallback((text: string) => {
    try {
      socketRef.current.sendChat(text);
      const newMessage: Message = {
        id: uuidv4(),
        text: text,
        sender: {
          id: userId,
          name: nickname || 'Anonymous',
        },
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      setJoinError("Failed to send message. Please check your connection.");
    }
  }, [nickname, userId]);
  const handleTypingStart = useCallback(() => {
    if (socket.isConnected) {
      setTyping(true);
    }
  }, [setTyping, socket.isConnected]);
  const handleTypingStop = useCallback(() => {
    if (socket.isConnected) {
      setTyping(false);
    }
  }, [setTyping, socket.isConnected]);
  const handleRoomIdCopy = useCallback(() => {
    setSnackbarOpen(true);
  }, []);
  if (!initialCheckPerformedRef.current) {
    return (
      <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }
  return (
    <Container 
      maxWidth="md" 
      sx={{ 
        height: '100vh', 
        py: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message="Room ID copied to clipboard"
      />
      <Paper 
        elevation={3}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }}
      >
        <ChatHeader onRoomIdCopy={handleRoomIdCopy} />
        {connectionStatus === 'error' && connectionError && (
          <Alert severity="error" sx={{ borderRadius: 0 }}>
            {connectionError}
          </Alert>
        )}
        {joinError && (
          <Alert severity="error" sx={{ borderRadius: 0 }}>
            {joinError}
          </Alert>
        )}
        {isJoining ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center',
            flexGrow: 1 
          }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Joining chat room...
            </Typography>
          </Box>
        ) : (
          <MessageList messages={messages} currentUserId={userId} />
        )
        }
        <Box>
          <TypingIndicator typingUsers={typingUserNicknames} />
          <MessageInputBar 
            onSendMessage={handleSendMessage} 
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
            disabled={connectionStatus !== 'connected' || isJoining || !joinedRoomRef.current}
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default ChatRoomPage;