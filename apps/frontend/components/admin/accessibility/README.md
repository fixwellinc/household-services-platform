# Admin Dashboard Accessibility Guide

This guide outlines the accessibility features implemented in the admin dashboard components and provides guidelines for maintaining and extending accessibility support.

## Overview

The admin dashboard has been designed with accessibility as a core principle, following WCAG 2.1 AA guidelines. All components include proper ARIA attributes, keyboard navigation support, and screen reader compatibility.

## Key Accessibility Features

### 1. Keyboard Navigation

All interactive elements are keyboard accessible:
- **Tab navigation**: All focusable elements can be reached using Tab/Shift+Tab
- **Arrow key navigation**: Lists, menus, and tables support arrow key navigation
- **Enter/Space activation**: Buttons and links can be activated with Enter or Space
- **Escape key**: Closes modals, dropdowns, and expanded content

### 2. Screen Reader Support

Components include comprehensive screen reader support:
- **Semantic HTML**: Proper use of headings, lists, tables, and form elements
- **ARIA labels**: Descriptive labels for complex interactions
- **ARIA roles**: Proper roles for custom components
- **Live regions**: Dynamic content updates are announced
- **Hidden decorative elements**: Icons and decorative elements are hidden from screen readers

### 3. Focus Management

Proper focus management throughout the application:
- **Visible focus indicators**: Clear focus rings on all interactive elements
- **Focus trapping**: Modals and dialogs trap focus appropriately
- **Focus restoration**: Focus returns to appropriate elements after interactions
- **Skip links**: Skip to main content functionality

### 4. Color and Contrast

Visual accessibility considerations:
- **High contrast**: All text meets WCAG AA contrast requirements
- **Color independence**: Information is not conveyed by color alone
- **Status indicators**: Use icons and text in addition to color
- **Focus indicators**: High contrast focus rings

## Component-Specific Features

### ResponsiveDataTable

- **Table semantics**: Proper table headers and cell associations
- **Sortable columns**: ARIA sort attributes and keyboard activation
- **Row selection**: Proper checkbox labeling and selection state
- **Mobile cards**: Structured content with proper headings and labels
- **Action menus**: Keyboard accessible dropdown menus

```tsx
// Example usage with accessibility features
<ResponsiveDataTable
  columns={[
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value) => <span aria-label={`Name: ${value}`}>{value}</span>
    }
  ]}
  data={data}
  actions={[
    {
      label: 'Edit',
      onClick: (row) => editItem(row),
      icon: Edit
    }
  ]}
/>
```

### ResponsiveNavigation

- **Navigation landmarks**: Proper nav elements with labels
- **Hierarchical structure**: Nested menus with proper ARIA attributes
- **Current page indication**: aria-current for active items
- **Expandable menus**: aria-expanded for collapsible sections
- **Mobile menu**: Proper modal behavior with focus trapping

```tsx
// Example usage
<ResponsiveNavigation
  items={navigationItems}
  currentPath="/admin/users"
  onItemClick={handleNavigation}
  logo={<Logo />}
  userMenu={<UserMenu />}
/>
```

### ResponsiveFormLayout

- **Form structure**: Proper fieldsets and legends
- **Label associations**: All inputs have associated labels
- **Error handling**: ARIA invalid and describedby attributes
- **Required fields**: Proper required field indication
- **Form validation**: Live error announcements

```tsx
// Example usage
<ResponsiveFormLayout
  title="User Settings"
  sections={[
    {
      id: 'personal',
      title: 'Personal Information',
      children: (
        <ResponsiveField
          id="email"
          label="Email Address"
          required
          error={errors.email}
        >
          <input type="email" />
        </ResponsiveField>
      )
    }
  ]}
/>
```

## Accessibility Utilities

### AccessibilityUtils Components

The `AccessibilityUtils.tsx` file provides several utility components:

#### SkipToMainContent
Provides a skip link for keyboard users to bypass navigation.

#### ScreenReaderOnly
Hides content visually while keeping it available to screen readers.

#### FocusTrap
Traps focus within a container (useful for modals).

#### AccessibleButton
Button component with comprehensive ARIA support.

#### AccessibleField
Form field wrapper with proper labeling and error handling.

### Custom Hooks

#### useFocusManagement
Manages focus state and restoration.

```tsx
const { setFocus, restoreFocus } = useFocusManagement();

// Set focus to an element
setFocus(buttonRef.current);

// Restore focus to previous element
restoreFocus();
```

#### useKeyboardNavigation
Provides keyboard navigation for lists and menus.

```tsx
const { activeIndex, handleKeyDown } = useKeyboardNavigation(
  items,
  (item, index) => selectItem(item)
);
```

## Testing Accessibility

### Automated Testing

Use these tools for automated accessibility testing:

```bash
# Install accessibility testing tools
npm install --save-dev @axe-core/react jest-axe

# Run accessibility tests
npm run test:a11y
```

### Manual Testing

1. **Keyboard Navigation**
   - Navigate using only the keyboard
   - Ensure all interactive elements are reachable
   - Verify focus indicators are visible

2. **Screen Reader Testing**
   - Test with NVDA (Windows), JAWS (Windows), or VoiceOver (Mac)
   - Verify content is announced correctly
   - Check heading structure and landmarks

3. **Color Contrast**
   - Use browser dev tools to check contrast ratios
   - Test with high contrast mode enabled
   - Verify information isn't conveyed by color alone

### Testing Checklist

- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible and high contrast
- [ ] Screen reader announces content correctly
- [ ] Form fields have proper labels and error handling
- [ ] Tables have proper headers and structure
- [ ] Images have appropriate alt text
- [ ] Color contrast meets WCAG AA standards
- [ ] Content is structured with proper headings
- [ ] Skip links are available and functional
- [ ] Error messages are announced to screen readers

## Best Practices

### When Creating New Components

1. **Start with semantic HTML**
   - Use proper HTML elements (button, input, nav, etc.)
   - Structure content with headings (h1, h2, h3)
   - Use lists for grouped content

2. **Add ARIA attributes when needed**
   - aria-label for elements without visible text
   - aria-describedby for additional descriptions
   - aria-expanded for collapsible content
   - role attributes for custom components

3. **Ensure keyboard accessibility**
   - All interactive elements should be focusable
   - Implement proper keyboard event handlers
   - Provide keyboard shortcuts where appropriate

4. **Test with assistive technology**
   - Use a screen reader to test your component
   - Navigate using only the keyboard
   - Check with users who rely on assistive technology

### Common Patterns

#### Loading States
```tsx
<div role="status" aria-live="polite" aria-label="Loading content">
  <div className="animate-pulse">Loading...</div>
</div>
```

#### Error Messages
```tsx
<div role="alert" aria-live="assertive">
  <p>Error: {errorMessage}</p>
</div>
```

#### Status Updates
```tsx
<div aria-live="polite" aria-atomic="true">
  <p>Status: {status}</p>
</div>
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

## Support

For questions about accessibility implementation or to report accessibility issues, please:

1. Check this guide for existing patterns
2. Review the WCAG guidelines
3. Test with assistive technology
4. Create an issue with detailed accessibility requirements

Remember: Accessibility is not a one-time implementation but an ongoing commitment to inclusive design.