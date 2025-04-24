import React, { useEffect, useState } from 'react';
import { Container, Paper, Box, Typography, Button, useTheme } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import RoomForm from '../components/RoomForm';
import { useRoomStore } from '../stores/roomStore';
import AvatarUpload from '../components/AvatarUpload';
import ThemeToggle from '../components/ThemeToggle';
import { v4 as uuidv4 } from 'uuid';

interface LocationState {
  roomId?: string;
}

export const LandingPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const setRoomDetails = useRoomStore((state) => state.setRoomDetails);
  
  const [roomId, setRoomId] = useState('');
  const [nickname, setNickname] = useState('');
  
  useEffect(() => {
    const state = location.state as LocationState | null;
    if (state?.roomId) {
      setRoomId(state.roomId);
    }
  }, [location]);
  
  const handleSubmit = (formRoomId: string, formNickname: string, isNewRoom: boolean) => {
    setRoomDetails(formRoomId, formNickname);
    
    if (isNewRoom) {
      const newRoomId = uuidv4();
      navigate(`/room/${newRoomId}`);
    } else {
      navigate(`/room/${formRoomId}`);
    }
  };

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
        
        <RoomForm 
          initialRoomId={roomId}
          initialNickname={nickname}
          onSubmit={handleSubmit}
        />
      </Paper>
    </Container>
  );
};

export default LandingPage;