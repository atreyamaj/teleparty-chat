import React from "react";
import { Box, Typography, Badge, Tooltip, IconButton, AppBar, Toolbar, Divider } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useRoomStore } from "../../stores/roomStore";
import ThemeToggle from "../ThemeToggle";

const statusColors = {
  idle: "#888888",
  connecting: "#ffc107",
  connected: "#4caf50",
  disconnected: "#f44336",
  error: "#f44336",
};

interface ChatHeaderProps {
  onRoomIdCopy?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onRoomIdCopy }) => {
  const roomId = useRoomStore((state) => state.roomId) || "Unknown Room";
  const nickname = useRoomStore((state) => state.nickname);
  const connectionStatus = useRoomStore((state) => state.connectionStatus);

  const handleCopyRoomId = () => {
    if (roomId && roomId !== "Unknown Room") {
      navigator.clipboard.writeText(roomId).catch(console.error);
      if (onRoomIdCopy) {
        onRoomIdCopy();
      }
    }
  };

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Tooltip title={`Status: ${connectionStatus}`}>
            <Badge
              sx={{
                "& .MuiBadge-badge": {
                  backgroundColor: statusColors[connectionStatus],
                },
              }}
              variant="dot"
            >
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Teleparty Chat
              </Typography>
            </Badge>
          </Tooltip>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ThemeToggle />
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24 }} />
          
          <Typography variant="body2" color="text.secondary">
            Room: {roomId.substring(0, 8)}...
          </Typography>
          <Tooltip title="Copy Room ID">
            <IconButton
              size="small"
              edge="end"
              color="inherit"
              aria-label="copy room id"
              onClick={handleCopyRoomId}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {nickname && (
            <Tooltip title="Your Nickname">
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                You: {nickname}
              </Typography>
            </Tooltip>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default ChatHeader;
