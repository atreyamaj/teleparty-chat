import React, { useEffect, useState } from 'react';
import { Box, Typography, keyframes } from '@mui/material';

const ellipsis = keyframes`
  0% {
    content: '.';
  }
  33% {
    content: '..';
  }
  66% {
    content: '...';
  }
  100% {
    content: '.';
  }
`;

interface TypingIndicatorProps {
  typingUsers: string[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  typingUsers 
}) => {
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const count = typingUsers.length;
    
    if (count === 0) {
      setMessage('');
    } else if (count === 1) {
      setMessage(`${typingUsers[0]} is typing`);
    } else if (count === 2) {
      setMessage(`${typingUsers[0]} and ${typingUsers[1]} are typing`);
    } else if (count === 3) {
      setMessage(`${typingUsers[0]}, ${typingUsers[1]} and ${typingUsers[2]} are typing`);
    } else {
      setMessage(`${typingUsers.length} people are typing`);
    }
  }, [typingUsers]);

  if (!message) return null;

  return (
    <Box
      sx={{
        p: 1,
        pb: 0,
        fontSize: '0.75rem',
        fontStyle: 'italic',
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          display: 'flex',
          '&::after': {
            content: '""',
            animation: `${ellipsis} 1.5s infinite`,
            width: '1.5em',
            textAlign: 'left',
          },
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default TypingIndicator;