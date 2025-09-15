# Payment Frequency UI Components

This directory contains React components for managing payment frequency in the Fixwell subscription system.

## Components

### PaymentFrequencySelector
A component that displays available payment frequency options and allows users to select their preferred billing frequency.

**Props:**
- `currentFrequency?: string` - The user's current payment frequency
- `planTier?: string` - The subscription plan tier
- `onFrequencySelect?: (frequency: string, option: FrequencyOption) => void` - Callback when a frequency is selected
- `disabled?: boolean` - Whether the selector is disabled
- `className?: string` - Additional CSS classes

### FrequencyComparisonTable
A detailed comparison table showing all available payment frequencies with their costs, savings, and discounts.

**Props:**
- `planTier?: string` - The subscription plan tier
- `currentFrequency?: string` - The user's current payment frequency
- `className?: string` - Additional CSS classes

### FrequencyChangeModal
A confirmation modal that appears when a user wants to change their payment frequency.

**Props:**
- `isOpen: boolean` - Whether the modal is open
- `onClose: () => void` - Callback to close the modal
- `currentFrequency: string` - Current payment frequency
- `newFrequency: string` - New payment frequency
- `newOption: FrequencyOption` - Details of the new frequency option
- `onConfirm: () => Promise<void>` - Callback to confirm the change

### PaymentFrequencyManager
A comprehensive component that combines all the above components into a complete payment frequency management interface.

**Props:**
- `currentFrequency?: string` - The user's current payment frequency (default: 'MONTHLY')
- `planTier?: string` - The subscription plan tier
- `onFrequencyChanged?: (newFrequency: string) => void` - Callback when frequency is successfully changed
- `className?: string` - Additional CSS classes

## Usage

### Basic Usage
```tsx
import { PaymentFrequencyManager } from '@/components/features/payment';

function SubscriptionPage() {
  return (
    <PaymentFrequencyManager
      currentFrequency="MONTHLY"
      planTier="STARTER"
      onFrequencyChanged={(newFrequency) => {
        console.log('Frequency changed to:', newFrequency);
      }}
    />
  );
}
```

### Individual Components
```tsx
import { 
  PaymentFrequencySelector,
  FrequencyComparisonTable,
  FrequencyChangeModal 
} from '@/components/features/payment';

function CustomFrequencyInterface() {
  const [showModal, setShowModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  return (
    <div>
      <PaymentFrequencySelector
        currentFrequency="MONTHLY"
        planTier="STARTER"
        onFrequencySelect={(frequency, option) => {
          setSelectedOption(option);
          setShowModal(true);
        }}
      />
      
      <FrequencyComparisonTable
        planTier="STARTER"
        currentFrequency="MONTHLY"
      />
      
      {showModal && selectedOption && (
        <FrequencyChangeModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          currentFrequency="MONTHLY"
          newFrequency={selectedOption.frequency}
          newOption={selectedOption}
          onConfirm={async () => {
            // Handle frequency change
          }}
        />
      )}
    </div>
  );
}
```

## Features

- **Simplified Options**: Only Monthly and Yearly billing frequencies for easier management
- **Responsive Design**: All components are mobile-friendly and responsive
- **Real-time Calculations**: Displays accurate payment amounts, discounts, and savings
- **Interactive Selection**: Visual feedback for selected options
- **Confirmation Flow**: Safe frequency changes with confirmation modals
- **Error Handling**: Graceful error handling with user-friendly messages
- **Accessibility**: Proper ARIA labels and keyboard navigation support

## API Integration

The components integrate with the following API endpoints:
- `GET /api/subscriptions/frequency-options` - Fetch available frequency options
- `POST /api/subscriptions/change-frequency` - Change payment frequency

## Styling

Components use Tailwind CSS classes and are designed to match the existing Fixwell design system. They include:
- Consistent color schemes (simplified for Monthly and Yearly options)
- Proper spacing and typography
- Interactive states (hover, focus, disabled)
- Loading states with spinners
- Success/error feedback with toast notifications

## Supported Frequencies

The system now supports only two billing frequencies for simplicity:
- **Monthly**: Standard billing with no discount
- **Yearly**: 10% discount for annual commitment

## Testing

Basic unit tests are included for the PaymentFrequencySelector component. To run tests:

```bash
npm test PaymentFrequencySelector.test.tsx
```

## Integration

The PaymentFrequencyManager is already integrated into the SubscriptionManagement component and will appear automatically for users with active subscriptions.