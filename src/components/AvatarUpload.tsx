import React, { useState, useRef } from 'react';
import { 
  Box, 
  Avatar, 
  IconButton, 
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Slider,
  Badge
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import { useUserStore } from '../stores/userStore';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MAX_BASE64_SIZE = 400000;

interface AvatarUploadProps {
  size?: number;
  disabled?: boolean;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({ 
  size = 64,
  disabled = false
}) => {
  const userIcon = useUserStore(state => state.userIcon);
  const setUserIcon = useUserStore(state => state.setUserIcon);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
  const [quality, setQuality] = useState(0.92);
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > MAX_FILE_SIZE) {
      setError(`File is too large (max ${MAX_FILE_SIZE / (1024 * 1024)}MB)`);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setTempImageSrc(result);
      setDialogOpen(true);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  const handleDeleteAvatar = () => {
    setUserIcon(null);
  };
  const handleDialogClose = () => {
    setDialogOpen(false);
    setTempImageSrc(null);
  };
  const handleSaveImage = () => {
    if (!tempImageSrc) return;
    try {
      if (tempImageSrc.length > MAX_BASE64_SIZE) {
        compressImage(tempImageSrc, quality)
          .then(compressed => {
            setUserIcon(compressed);
            setDialogOpen(false);
            setTempImageSrc(null);
          })
          .catch(err => {
            setError(`Failed to compress image: ${err.message}`);
          });
      } else {
        setUserIcon(tempImageSrc);
        setDialogOpen(false);
        setTempImageSrc(null);
      }
    } catch (err) {
      setError('Failed to process image');
    }
  };
  const handleQualityChange = (_event: Event, newValue: number | number[]) => {
    setQuality(newValue as number);
  };
  const compressImage = (src: string, qualityValue: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIMENSION = 400;
        let width = img.width;
        let height = img.height;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.floor(height * (MAX_DIMENSION / width));
            width = MAX_DIMENSION;
          } else {
            width = Math.floor(width * (MAX_DIMENSION / height));
            height = MAX_DIMENSION;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', qualityValue));
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      img.src = src;
    });
  };
  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', mb: 2 }}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            <Tooltip title="Upload avatar">
              <IconButton
                aria-label="upload avatar"
                component="label"
                disabled={disabled}
                sx={{
                  width: size / 3,
                  height: size / 3,
                  backgroundColor: 'background.paper',
                  boxShadow: 1,
                  '&:hover': { backgroundColor: 'primary.main', color: 'white' }
                }}
              >
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
                <PhotoCameraIcon sx={{ fontSize: size / 5 }} />
              </IconButton>
            </Tooltip>
          }
        >
          <Avatar
            src={userIcon || undefined}
            sx={{ width: size, height: size }}
            alt="User avatar"
          />
        </Badge>
        {userIcon && (
          <Tooltip title="Remove avatar">
            <IconButton 
              size="small" 
              aria-label="delete avatar" 
              onClick={handleDeleteAvatar}
              disabled={disabled}
              sx={{ mt: 1 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {error && (
          <Typography color="error" variant="caption" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </Box>
      <Dialog 
        open={dialogOpen} 
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Adjust Your Avatar</DialogTitle>
        <DialogContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            mt: 2 
          }}>
            <Avatar
              src={tempImageSrc || undefined}
              sx={{ width: 150, height: 150, mb: 3 }}
              alt="Avatar preview"
            />
            <Typography id="quality-slider" gutterBottom>
              Image Quality: {Math.round(quality * 100)}%
            </Typography>
            <Box sx={{ width: '80%', maxWidth: 300 }}>
              <Slider
                value={quality}
                min={0.1}
                max={1}
                step={0.05}
                onChange={handleQualityChange}
                aria-labelledby="quality-slider"
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
              Lower quality creates a smaller file size
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSaveImage} color="primary">
            Save Avatar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AvatarUpload;