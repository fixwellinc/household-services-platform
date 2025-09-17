# Customer Dashboard Test Suite

This directory contains comprehensive tests for the customer dashboard functionality, covering unit tests, integration tests, and end-to-end tests.

## Test Structure

### Unit Tests (`components/customer/`)
Tests for individual React components with mocked dependencies:

- **`subscription-overview/`**
  - `CurrentPlanCard.test.tsx` - Tests subscription plan display, pricing, billing cycles, and action buttons
  - `BillingInformation.test.tsx` - Tests payment methods, invoice history, and billing management
  - `SubscriptionStatus.test.tsx` - Tests subscription status indicators, error states, and recovery actions

- **`perks-benefits/`**
  - `PerksList.test.tsx` - Tests perk display, tier-based access, usage tracking, and upgrade prompts
  - `UsageTracker.test.tsx` - Tests usage metrics, progress bars, alerts, and trend visualization

- **`services/`**
  - `ServiceRequestForm.test.tsx` - Tests form validation, file uploads, urgency selection, and submission

### Integration Tests (`integration/`)
Tests for API interactions and component workflows:

- **`customer-dashboard-api.test.tsx`** - Tests all API endpoints:
  - Subscription data retrieval
  - Perks and services API
  - Usage analytics API
  - Error handling and rate limiting

- **`subscription-management-workflow.test.tsx`** - Tests subscription management flows:
  - Plan upgrade workflow with preview and confirmation
  - Cancellation flow with retention offers
  - Payment method update workflow

- **`real-time-updates.test.tsx`** - Tests WebSocket integration:
  - Subscription status changes
  - Usage limit notifications
  - Billing event updates
  - Connection management

### End-to-End Tests (`e2e/`)
Tests for complete user journeys:

- **`customer-dashboard-journey.test.tsx`** - Tests complete user workflows:
  - New customer onboarding and first service request
  - Existing customer plan upgrade journey
  - Premium customer service request with file uploads
  - Payment failure and recovery workflow

- **`subscription-change-workflows.test.tsx`** - Tests subscription management:
  - Plan downgrade with feature loss warnings
  - Subscription cancellation with retention offers and feedback
  - Subscription reactivation for cancelled accounts

- **`service-request-submission.test.tsx`** - Tests service request flows:
  - Basic service request from selection to confirmation
  - Premium service request with file uploads and scheduling
  - Form validation and error handling

## Test Coverage

### Components Tested
- ✅ CurrentPlanCard - Subscription display and actions
- ✅ BillingInformation - Payment methods and invoice history
- ✅ SubscriptionStatus - Status indicators and recovery actions
- ✅ PerksList - Tier-based perks and upgrade prompts
- ✅ UsageTracker - Usage metrics and limit warnings
- ✅ ServiceRequestForm - Form validation and submission

### API Endpoints Tested
- ✅ `/api/customer/subscription` - Subscription data
- ✅ `/api/customer/subscription/usage` - Usage statistics
- ✅ `/api/customer/perks` - Tier-specific perks
- ✅ `/api/customer/services` - Available services
- ✅ `/api/customer/service-requests` - Service request submission
- ✅ `/api/customer/subscription/change-plan` - Plan modifications
- ✅ `/api/customer/subscription/cancel` - Subscription cancellation
- ✅ `/api/customer/payment-methods` - Payment method management
- ✅ `/api/customer/usage` - Usage analytics
- ✅ `/api/customer/usage/export` - Usage data export

### User Workflows Tested
- ✅ New customer onboarding journey
- ✅ Plan upgrade/downgrade workflows
- ✅ Subscription cancellation with retention
- ✅ Service request submission (basic and premium)
- ✅ Payment failure recovery
- ✅ Real-time notification handling
- ✅ File upload and scheduling

### Error Scenarios Tested
- ✅ Network errors and API failures
- ✅ Authentication and authorization errors
- ✅ Form validation errors
- ✅ Payment processing errors
- ✅ File upload validation
- ✅ Rate limiting
- ✅ WebSocket connection issues

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm test -- --testPathPattern="components"
```

### Integration Tests Only
```bash
npm test -- --testPathPattern="integration"
```

### End-to-End Tests Only
```bash
npm test -- --testPathPattern="e2e"
```

### Specific Component Tests
```bash
npm test -- CurrentPlanCard.test.tsx
npm test -- BillingInformation.test.tsx
npm test -- ServiceRequestForm.test.tsx
```

### With Coverage
```bash
npm test -- --coverage
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- Uses Next.js Jest configuration
- JSdom test environment for React components
- Module name mapping for `@/` imports
- Coverage collection from components, app, and lib directories

### Test Setup (`jest.setup.js`)
- Testing Library Jest DOM matchers
- Next.js router and navigation mocks
- Global test utilities and helpers

## Mock Strategy

### UI Components
All UI components from `@/components/ui/shared` are mocked with simple div/button elements to focus on logic testing rather than styling.

### External Dependencies
- **Next.js Router**: Mocked with navigation tracking
- **Fetch API**: Mocked globally for API testing
- **Socket.IO**: Mocked for real-time update testing
- **Toast Notifications**: Mocked for user feedback testing
- **File Upload**: Mocked FormData for file handling

### Authentication Context
Mocked with different user states (new, existing, premium) to test tier-specific functionality.

## Best Practices Followed

### Unit Tests
- Test component rendering with various props
- Test user interactions and event handlers
- Test conditional rendering based on state
- Test error states and edge cases
- Mock external dependencies appropriately

### Integration Tests
- Test API request/response cycles
- Test error handling and recovery
- Test data flow between components
- Test real-time updates and WebSocket events
- Verify correct API call parameters

### End-to-End Tests
- Test complete user journeys from start to finish
- Test cross-component interactions
- Test navigation and routing
- Test form submissions and validations
- Test error recovery workflows

### General
- Clear test descriptions and organization
- Comprehensive assertions
- Proper cleanup between tests
- Realistic test data and scenarios
- Good separation of concerns

## Future Enhancements

### Additional Test Types
- Visual regression tests with screenshot comparison
- Performance tests for large datasets
- Accessibility tests with axe-core
- Cross-browser compatibility tests

### Test Automation
- Continuous integration test runs
- Automated test report generation
- Test coverage tracking and enforcement
- Parallel test execution for faster feedback

### Enhanced Mocking
- More realistic API response mocking
- Database state mocking for integration tests
- Third-party service mocking (Stripe, email, etc.)
- Time-based testing with date mocking