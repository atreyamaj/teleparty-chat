import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Box, Paper, Alert, Snackbar, CircularProgress, Typography } from '@mui/material';
import ChatHeader from '../components/chat/ChatHeader';
import MessageList, { Message } from '../components/chat/MessageList';
import MessageInputBar from '../components/chat/MessageInputBar';
import { useRoomStore } from '../stores/roomStore';
import TypingIndicator from '../components/chat/TypingIndicator';
import { v4 as uuidv4 } from 'uuid';

export const ChatRoomPage: React.FC = () => {
  const { id: roomId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const nickname = useRoomStore(state => state.nickname);
  const connectionStatus = useRoomStore(state => state.connectionStatus);
  const joinRoom = useRoomStore(state => state.joinRoom);
  const connectionError = useRoomStore(state => state.connectionError);

  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [userId] = useState(() => uuidv4());

  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    if (!nickname) {
      navigate('/', { state: { roomId } });
      return;
    }

    joinRoom(roomId);

    const initialMessage: Message = {
      id: uuidv4(),
      text: `Welcome to the chat room!`,
      sender: {
        id: 'system',
        name: 'System',
      },
      timestamp: new Date(),
      isSystemMessage: true
    };

    setMessages([initialMessage]);
  }, [roomId, navigate, nickname, joinRoom]);

  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: uuidv4(),
      text: text,
      sender: {
        id: userId,
        name: nickname || 'Anonymous',
      },
      timestamp: new Date()
    };
    
    setMessages([...messages, newMessage]);
  };

  const handleTypingStart = () => {
    console.log('User started typing');
  };

  const handleTypingStop = () => {
    console.log('User stopped typing');
  };
  
  const handleRoomIdCopy = () => {
    setSnackbarOpen(true);
  };

  if (!roomId || !nickname) {
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
        
        <MessageList messages={messages} currentUserId={userId} />
        
        <Box>
          <TypingIndicator typingUsers={typingUsers} />
          <MessageInputBar 
            onSendMessage={handleSendMessage} 
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
            disabled={connectionStatus !== 'connected'}
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default ChatRoomPage;