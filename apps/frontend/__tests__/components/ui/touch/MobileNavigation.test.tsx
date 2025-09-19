import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MobileNavigation } from '@/components/ui/touch/MobileNavigation';

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: jest.fn(),
});

describe('MobileNavigation', () => {
  const mockProps = {
    isOpen: false,
    onToggle: jest.fn(),
    onClose: jest.fn(),
    onLogout: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders toggle button', () => {
    render(<MobileNavigation {...mockProps} />);
    
    const toggleButton = screen.getByRole('button', { name: /open menu/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it('shows menu when isOpen is true', () => {
    render(<MobileNavigation {...mockProps} isOpen={true} />);
    
    expect(screen.getByRole('dialog', { name: /mobile navigation menu/i })).toBeInTheDocument();
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('displays navigation items', () => {
    render(<MobileNavigation {...mockProps} isOpen={true} />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('Plans')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('shows user profile when user is provided', () => {
    const user = {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Customer',
    };

    render(<MobileNavigation {...mockProps} isOpen={true} user={user} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Customer')).toBeInTheDocument();
  });

  it('shows user-specific menu items when user is logged in', () => {
    const user = {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Customer',
    };

    render(<MobileNavigation {...mockProps} isOpen={true} user={user} />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('shows auth buttons when user is not logged in', () => {
    render(<MobileNavigation {...mockProps} isOpen={true} user={null} />);
    
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<MobileNavigation {...mockProps} isOpen={true} />);
    
    const closeButton = screen.getByRole('button', { name: '' }); // Close button without text
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('calls onLogout when sign out is clicked', () => {
    const user = {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Customer',
    };

    render(<MobileNavigation {...mockProps} isOpen={true} user={user} />);
    
    const signOutButton = screen.getByText('Sign Out');
    fireEvent.click(signOutButton);
    
    expect(mockProps.onLogout).toHaveBeenCalled();
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('closes menu when navigation item is clicked', () => {
    render(<MobileNavigation {...mockProps} isOpen={true} />);
    
    const homeLink = screen.getByText('Home');
    fireEvent.click(homeLink);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('handles escape key to close menu', () => {
    render(<MobileNavigation {...mockProps} isOpen={true} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('prevents body scroll when menu is open', () => {
    const { rerender } = render(<MobileNavigation {...mockProps} isOpen={false} />);
    
    expect(document.body.style.overflow).toBe('');
    
    rerender(<MobileNavigation {...mockProps} isOpen={true} />);
    
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('shows badge for new items', () => {
    render(<MobileNavigation {...mockProps} isOpen={true} />);
    
    expect(screen.getByText('New')).toBeInTheDocument(); // Members Discount has "New" badge
  });

  it('animates menu toggle button icon', () => {
    const { rerender } = render(<MobileNavigation {...mockProps} isOpen={false} />);
    
    // Menu icon should be visible when closed
    const menuIcon = document.querySelector('.opacity-100');
    expect(menuIcon).toBeInTheDocument();
    
    rerender(<MobileNavigation {...mockProps} isOpen={true} />);
    
    // X icon should be visible when open
    const xIcon = document.querySelector('.opacity-100');
    expect(xIcon).toBeInTheDocument();
  });

  it('handles touch gestures for swipe to close', () => {
    render(<MobileNavigation {...mockProps} isOpen={true} />);
    
    const menu = screen.getByRole('dialog');
    
    // Simulate swipe left gesture
    fireEvent.touchStart(menu, {
      touches: [{ clientX: 200, clientY: 100 }],
    });
    
    fireEvent.touchMove(menu, {
      touches: [{ clientX: 50, clientY: 100 }],
    });
    
    fireEvent.touchEnd(menu);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('has proper ARIA attributes for accessibility', () => {
    render(<MobileNavigation {...mockProps} isOpen={true} />);
    
    const menu = screen.getByRole('dialog');
    expect(menu).toHaveAttribute('aria-modal', 'true');
    expect(menu).toHaveAttribute('aria-label', 'Mobile navigation menu');
    
    const toggleButton = screen.getByRole('button', { name: /close menu/i });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows swipe indicator', () => {
    render(<MobileNavigation {...mockProps} isOpen={true} />);
    
    const swipeIndicator = document.querySelector('.w-1.h-12');
    expect(swipeIndicator).toBeInTheDocument();
  });

  it('applies correct transform classes for animation', () => {
    const { rerender } = render(<MobileNavigation {...mockProps} isOpen={false} />);
    
    rerender(<MobileNavigation {...mockProps} isOpen={true} />);
    
    const menu = screen.getByRole('dialog');
    expect(menu).toHaveClass('translate-x-0');
  });
});