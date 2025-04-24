import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  IconButton, 
  InputAdornment,
  Avatar,
  useTheme
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useUserStore } from '../../stores/userStore';
import { useRoomStore } from '../../stores/roomStore';
import { debounce } from '../../utils/debounce';

interface MessageInputBarProps {
  disabled?: boolean;
  onSendMessage: (text: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export const MessageInputBar: React.FC<MessageInputBarProps> = ({
  disabled = false,
  onSendMessage,
  onTypingStart,
  onTypingStop
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const userIcon = useUserStore(state => state.userIcon);
  const nickname = useRoomStore(state => state.nickname);
  const theme = useTheme();
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const debouncedTypingStop = useRef(debounce(() => {
    if (onTypingStop) onTypingStop();
    setIsTyping(false);
  }, 1500)).current;
  
  const handleTyping = () => {
    if (!isTyping && onTypingStart) {
      setIsTyping(true);
      onTypingStart();
    }
    
    debouncedTypingStop();
  };

  const handleSend = () => {
    if (message.trim() !== '') {
      onSendMessage(message.trim());
      setMessage('');
      
      if (isTyping && onTypingStop) {
        onTypingStop();
        setIsTyping(false);
      }
      
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    handleTyping();
  };

  return (
    <Box
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1,
        bgcolor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Avatar
        src={userIcon || undefined}
        alt={nickname || 'User'}
        sx={{ width: 36, height: 36 }}
      />
      <TextField
        fullWidth
        disabled={disabled}
        placeholder="Type a message..."
        multiline
        maxRows={4}
        value={message}
        onChange={handleInputChange}
        onKeyDown={handleKeyPress}
        variant="outlined"
        inputRef={inputRef}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton 
                edge="end" 
                onClick={handleSend}
                disabled={disabled || message.trim() === ''}
                color="primary"
              >
                <SendIcon />
              </IconButton>
            </InputAdornment>
          ),
          sx: {
            alignItems: 'center'
          }
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '24px',
          },
        }}
      />
    </Box>
  );
};

export default MessageInputBar;
