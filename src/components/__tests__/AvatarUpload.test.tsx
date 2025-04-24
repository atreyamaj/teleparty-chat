import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AvatarUpload from '../AvatarUpload';
import { useUserStore } from '../../stores/userStore';

// Mock the userStore
vi.mock('../../stores/userStore', () => ({
  useUserStore: vi.fn(),
}));

describe('AvatarUpload Component', () => {
  const mockSetUserIcon = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation for userStore
    (useUserStore as unknown as vi.Mock).mockImplementation((selector) => {
      const store = {
        userIcon: null,
        setUserIcon: mockSetUserIcon,
      };
      return selector(store);
    });
  });

  it('renders avatar without icon by default', () => {
    render(<AvatarUpload />);
    expect(screen.getByAltText('User avatar')).toBeInTheDocument();
  });

  it('renders avatar with icon when provided', () => {
    // Mock userIcon to be present
    (useUserStore as unknown as vi.Mock).mockImplementation((selector) => {
      const store = {
        userIcon: 'data:image/png;base64,test',
        setUserIcon: mockSetUserIcon,
      };
      return selector(store);
    });
    
    render(<AvatarUpload />);
    
    const avatarImg = screen.getByAltText('User avatar');
    expect(avatarImg).toBeInTheDocument();
    expect(avatarImg).toHaveAttribute('src', 'data:image/png;base64,test');
  });

  it('displays upload button', () => {
    render(<AvatarUpload />);
    expect(screen.getByLabelText('upload avatar')).toBeInTheDocument();
  });

  it('shows delete button when avatar exists', () => {
    // Mock userIcon to be present
    (useUserStore as unknown as vi.Mock).mockImplementation((selector) => {
      const store = {
        userIcon: 'data:image/png;base64,test',
        setUserIcon: mockSetUserIcon,
      };
      return selector(store);
    });
    
    render(<AvatarUpload />);
    expect(screen.getByLabelText('delete avatar')).toBeInTheDocument();
  });

  it('calls setUserIcon(null) when delete button is clicked', () => {
    // Mock userIcon to be present
    (useUserStore as unknown as vi.Mock).mockImplementation((selector) => {
      const store = {
        userIcon: 'data:image/png;base64,test',
        setUserIcon: mockSetUserIcon,
      };
      return selector(store);
    });
    
    render(<AvatarUpload />);
    
    const deleteButton = screen.getByLabelText('delete avatar');
    fireEvent.click(deleteButton);
    
    expect(mockSetUserIcon).toHaveBeenCalledWith(null);
  });

  it('is disabled when disabled prop is true', () => {
    render(<AvatarUpload disabled={true} />);
    
    expect(screen.getByLabelText('upload avatar')).toBeDisabled();
  });
});