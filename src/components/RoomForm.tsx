import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Tab, Tabs, Typography } from '@mui/material';

interface RoomFormProps {
  onSubmit: (roomId: string, nickname: string, isNewRoom: boolean) => void;
  initialRoomId?: string;
  initialNickname?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`room-tabpanel-${index}`}
      aria-labelledby={`room-tab-${index}`}
      {...other}
      style={{ width: '100%' }}
    >
      {value === index && (
        <Box sx={{ pt: 3, width: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `room-tab-${index}`,
    'aria-controls': `room-tabpanel-${index}`,
  };
};

export const RoomForm: React.FC<RoomFormProps> = ({ 
  onSubmit, 
  initialRoomId = '', 
  initialNickname = '' 
}) => {
  const [roomId, setRoomId] = useState(initialRoomId);
  const [nickname, setNickname] = useState(initialNickname);
  const [tabValue, setTabValue] = useState(initialRoomId ? 0 : 1);
  const [errors, setErrors] = useState({
    roomId: '',
    nickname: ''
  });

  useEffect(() => {
    if (initialRoomId) {
      setRoomId(initialRoomId);
      setTabValue(0);
    }
  }, [initialRoomId]);

  useEffect(() => {
    if (initialNickname) {
      setNickname(initialNickname);
    }
  }, [initialNickname]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const validate = () => {
    const newErrors = {
      roomId: '',
      nickname: ''
    };
    
    let isValid = true;

    if (tabValue === 0 && !roomId.trim()) {
      newErrors.roomId = 'Room ID is required';
      isValid = false;
    }

    if (!nickname.trim()) {
      newErrors.nickname = 'Nickname is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      const isNewRoom = tabValue === 1;
      onSubmit(roomId, nickname, isNewRoom);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange} 
        variant="fullWidth" 
        aria-label="room options"
      >
        <Tab label="Join Existing Room" {...a11yProps(0)} />
        <Tab label="Create New Room" {...a11yProps(1)} />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <TextField
          fullWidth
          label="Room ID"
          variant="outlined"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          error={!!errors.roomId}
          helperText={errors.roomId}
          sx={{ mb: 2 }}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          A new room will be created when you click Join
        </Typography>
      </TabPanel>

      <TextField
        fullWidth
        label="Your Nickname"
        variant="outlined"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        error={!!errors.nickname}
        helperText={errors.nickname}
        sx={{ mb: 3 }}
      />

      <Button 
        type="submit" 
        variant="contained" 
        color="primary" 
        fullWidth 
        size="large"
      >
        {tabValue === 0 ? 'Join Room' : 'Create & Join Room'}
      </Button>
    </Box>
  );
};

export default RoomForm;