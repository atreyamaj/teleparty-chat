import React, { useEffect, useRef } from 'react';
import { Box, List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, Paper, useTheme } from '@mui/material';

export interface Message {
  id: string;
  text: string;
  sender: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  timestamp: Date;
  isSystemMessage?: boolean;
}

interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Box sx={{ 
      flexGrow: 1, 
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column',
      p: 2,
      gap: 1,
    }}>
      {messages.map((message) => {
        const isCurrentUser = message.sender.id === currentUserId;
        const isSystem = message.isSystemMessage;
        
        if (isSystem) {
          return (
            <Box 
              key={message.id} 
              sx={{ 
                display: 'flex',
                justifyContent: 'center',
                my: 1 
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  fontStyle: 'italic',
                  color: 'text.secondary',
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.05)',
                  px: 2,
                  py: 0.5,
                  borderRadius: '16px'
                }}
              >
                {message.text}
              </Typography>
            </Box>
          );
        }
        
        return (
          <Box 
            key={message.id}
            sx={{
              display: 'flex',
              justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
              mb: 1
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
                maxWidth: '75%',
                gap: 1
              }}
            >
              {!isCurrentUser && (
                <Avatar 
                  src={message.sender.avatarUrl} 
                  alt={message.sender.name}
                  sx={{ width: 32, height: 32 }}
                />
              )}
              
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
                }}
              >
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{
                    ml: isCurrentUser ? 0 : 1,
                    mr: isCurrentUser ? 1 : 0,
                  }}
                >
                  {isCurrentUser ? 'You' : message.sender.name} • {formatTime(message.timestamp)}
                </Typography>
                
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    bgcolor: isCurrentUser 
                      ? theme.palette.primary.main
                      : theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.05)',
                    color: isCurrentUser ? '#fff' : 'text.primary',
                    borderRadius: '16px',
                    borderTopLeftRadius: isCurrentUser ? '16px' : '4px',
                    borderTopRightRadius: isCurrentUser ? '4px' : '16px',
                    wordBreak: 'break-word'
                  }}
                >
                  {message.text}
                </Paper>
              </Box>
            </Box>
          </Box>
        );
      })}
      <div ref={bottomRef} />
    </Box>
  );
};

export default MessageList;
