// Accessibility utilities
export const focusStyles = {
  outline: '2px solid #3b82f6',
  outlineOffset: '2px',
};

export const srOnly = {
  position: 'absolute' as const,
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap' as const,
  border: '0',
};

// ARIA labels for common actions
export const ariaLabels = {
  close: 'Close',
  open: 'Open',
  menu: 'Menu',
  search: 'Search',
  loading: 'Loading',
  error: 'Error',
  success: 'Success',
  warning: 'Warning',
  info: 'Information',
};

// Keyboard navigation helpers
export const handleKeyDown = (
  event: React.KeyboardEvent,
  action: () => void,
  keys: string[] = ['Enter', ' ']
) => {
  if (keys.includes(event.key)) {
    event.preventDefault();
    action();
  }
};

// Focus management
export const focusFirstElement = (container: HTMLElement) => {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  if (focusableElements.length > 0) {
    (focusableElements[0] as HTMLElement).focus();
  }
};

export const trapFocus = (event: KeyboardEvent, container: HTMLElement) => {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  if (event.key === 'Tab') {
    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }
}; 