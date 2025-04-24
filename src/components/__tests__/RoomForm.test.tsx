import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RoomForm from '../RoomForm';
import { validate as uuidValidate } from 'uuid';

// Mock the useSocket hook
vi.mock('../../providers/SocketProvider', () => ({
  useSocket: () => ({
    createRoom: vi.fn().mockResolvedValue('mock-uuid-123'),
    joinRoom: vi.fn().mockResolvedValue(true),
  }),
}));

// Mock uuid validation
vi.mock('uuid', () => ({
  validate: vi.fn(),
}));

describe('RoomForm Component', () => {
  const onSuccessMock = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    onSuccessMock.mockReset();
  });

  describe('Create Room Mode', () => {
    it('renders create room form correctly', () => {
      render(<RoomForm mode="create" onSuccess={onSuccessMock} />);
      
      expect(screen.getByText('Create a New Room')).toBeTruthy();
      expect(screen.getByLabelText('Nickname')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Room/i })).toBeInTheDocument();
      expect(screen.queryByLabelText('Room ID')).not.toBeInTheDocument();
    });

    it('validates nickname is required', async () => {
      render(<RoomForm mode="create" onSuccess={onSuccessMock} />);
      
      const submitButton = screen.getByRole('button', { name: /Create Room/i });
      
      await act(async () => {
        fireEvent.click(submitButton);
      });
      
      expect(await screen.findByText('Nickname is required')).toBeInTheDocument();
      expect(onSuccessMock).not.toHaveBeenCalled();
    });

    it('validates nickname max length', async () => {
      render(<RoomForm mode="create" onSuccess={onSuccessMock} />);
      
      const nicknameInput = screen.getByLabelText('Nickname');
      const submitButton = screen.getByRole('button', { name: /Create Room/i });
      
      await act(async () => {
        fireEvent.change(nicknameInput, { target: { value: 'a'.repeat(31) } });
        fireEvent.click(submitButton);
      });
      
      expect(await screen.findByText('Nickname must be 30 characters or less')).toBeInTheDocument();
      expect(onSuccessMock).not.toHaveBeenCalled();
    });

    it('submits form with valid data', async () => {
      render(<RoomForm mode="create" onSuccess={onSuccessMock} />);
      
      const nicknameInput = screen.getByLabelText('Nickname');
      const submitButton = screen.getByRole('button', { name: /Create Room/i });
      
      await act(async () => {
        fireEvent.change(nicknameInput, { target: { value: 'TestUser' } });
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(onSuccessMock).toHaveBeenCalledWith('mock-uuid-123');
      });
    });
  });

  describe('Join Room Mode', () => {
    it('renders join room form correctly', () => {
      render(<RoomForm mode="join" onSuccess={onSuccessMock} />);
      
      expect(screen.getByText('Join an Existing Room')).toBeInTheDocument();
      expect(screen.getByLabelText('Nickname')).toBeInTheDocument();
      expect(screen.getByLabelText('Room ID')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Join Room/i })).toBeInTheDocument();
    });

    it('validates roomId is required', async () => {
      render(<RoomForm mode="join" onSuccess={onSuccessMock} />);
      
      const nicknameInput = screen.getByLabelText('Nickname');
      const submitButton = screen.getByRole('button', { name: /Join Room/i });
      
      await act(async () => {
        fireEvent.change(nicknameInput, { target: { value: 'TestUser' } });
        fireEvent.click(submitButton);
      });
      
      expect(await screen.findByText('Room ID is required')).toBeInTheDocument();
      expect(onSuccessMock).not.toHaveBeenCalled();
    });

    it('validates roomId must be a valid UUID', async () => {
      // Mock the UUID validation to return false for invalid UUID
      (uuidValidate as unknown as vi.Mock).mockReturnValue(false);
      
      render(<RoomForm mode="join" onSuccess={onSuccessMock} />);
      
      const nicknameInput = screen.getByLabelText('Nickname');
      const roomIdInput = screen.getByLabelText('Room ID');
      const submitButton = screen.getByRole('button', { name: /Join Room/i });
      
      await act(async () => {
        fireEvent.change(nicknameInput, { target: { value: 'TestUser' } });
        fireEvent.change(roomIdInput, { target: { value: 'invalid-uuid' } });
        fireEvent.click(submitButton);
      });
      
      expect(await screen.findByText('Invalid room ID format')).toBeInTheDocument();
      expect(onSuccessMock).not.toHaveBeenCalled();
    });

    it('submits form with valid data', async () => {
      // Mock the UUID validation to return true for valid UUID
      (uuidValidate as unknown as vi.Mock).mockReturnValue(true);
      
      render(<RoomForm mode="join" onSuccess={onSuccessMock} />);
      
      const nicknameInput = screen.getByLabelText('Nickname');
      const roomIdInput = screen.getByLabelText('Room ID');
      const submitButton = screen.getByRole('button', { name: /Join Room/i });
      
      await act(async () => {
        fireEvent.change(nicknameInput, { target: { value: 'TestUser' } });
        fireEvent.change(roomIdInput, { target: { value: '123e4567-e89b-12d3-a456-426614174000' } });
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(onSuccessMock).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      });
    });
  });
});