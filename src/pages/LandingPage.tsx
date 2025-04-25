import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Container, Paper, Box, Typography, Button, useTheme, CircularProgress } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import RoomForm from '../components/RoomForm';
import { useRoomStore } from '../stores/roomStore';
import AvatarUpload from '../components/AvatarUpload';
import ThemeToggle from '../components/ThemeToggle';
import { useSocket } from '../providers/SocketProvider';
import { useUserStore } from '../stores/userStore';

interface LocationState {
  roomId?: string;
}

export const LandingPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useSocket();
  const userIcon = useUserStore(state => state.userIcon);
  const setRoomDetails = useRoomStore(state => state.setRoomDetails);
  const socketRef = useRef(socket);
  const [roomId, setRoomId] = useState('');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigationAttemptedRef = useRef(false);
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);
  useEffect(() => {
    const state = location.state as LocationState | null;
    if (state?.roomId) {
      setRoomId(state.roomId);
    }
  }, [location]);
  const handleSubmit = async (formRoomId: string, formNickname: string, isNewRoom: boolean) => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    navigationAttemptedRef.current = false;
    try {
      console.log(`Handling ${isNewRoom ? 'create' : 'join'} room action with nickname: ${formNickname}`);
      if (isNewRoom) {
        const newRoomId = await socketRef.current.createRoom(formNickname, userIcon || undefined);
        console.log(`Created room: ${newRoomId}`);
        setRoomDetails(newRoomId, formNickname);
        if (!navigationAttemptedRef.current) {
          navigationAttemptedRef.current = true;
          navigate(`/room/${newRoomId}`, { state: { justCreated: true } });
        }
      } else {
        await socketRef.current.joinRoom(formNickname, formRoomId, userIcon || undefined);
        setRoomDetails(formRoomId, formNickname);
        if (!navigationAttemptedRef.current) {
          navigationAttemptedRef.current = true;
          navigate(`/room/${formRoomId}`);
        }
      }
    } catch (err) {
      console.error('Error handling room action:', err);
      setError(err instanceof Error ? err.message : 'Failed to perform room action');
      setIsLoading(false);
      navigationAttemptedRef.current = false;
    }
  };
  useEffect(() => {
    if (socket.error) {
      setIsLoading(false);
      setError(socket.error);
    }
  }, [socket.error]);
  useEffect(() => {
    if (isLoading && !socket.isConnecting && !navigationAttemptedRef.current) {
      setIsLoading(false);
    }
  }, [socket.isConnecting, isLoading]);
  return (
    <Container 
      maxWidth="sm" 
      sx={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        py: 4
      }}
    >
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        <ThemeToggle />
      </Box>
      <Paper 
        elevation={3}
        sx={{ 
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper
        }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          color="primary"
          sx={{ fontWeight: 'bold' }}
        >
          Teleparty Chat
        </Typography>
        <Box sx={{ width: '100%', mb: 3 }}>
          <AvatarUpload size={80} />
        </Box>
        {error && (
          <Typography 
            color="error" 
            variant="body2" 
            sx={{ mb: 2, width: '100%', textAlign: 'center' }}
          >
            {error}
          </Typography>
        )}
        {isLoading ? (
          <CircularProgress size={40} sx={{ my: 4 }} />
        ) : (
          <RoomForm 
            initialRoomId={roomId}
            initialNickname={nickname}
            onSubmit={handleSubmit}
          />
        )}
        {socket.isConnecting && (
          <Typography 
            color="text.secondary" 
            variant="body2" 
            sx={{ mt: 2, width: '100%', textAlign: 'center' }}
          >
            Connecting to server...
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default LandingPage;