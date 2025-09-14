import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import PlanUpgradeModal from '@/components/features/subscription/PlanUpgradeModal';
import api from '@/lib/api';

// Mock the API
vi.mock('@/lib/api', () => ({
    default: {
        getPlanChangePreview: vi.fn(),
        changePlan: vi.fn()
    }
}));

// Mock toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn()
    }
}));

const mockPreview = {
    currentPlan: {
        id: 'starter',
        name: 'Starter Plan',
        monthlyPrice: 21.99
    },
    newPlan: {
        id: 'homecare',
        name: 'HomeCare Plan',
        monthlyPrice: 54.99
    },
    isUpgrade: true,
    canChange: true,
    restrictions: [],
    billingPreview: {
        currentPrice: 21.99,
        newPrice: 54.99,
        proratedDifference: 16.5,
        immediateCharge: 16.5,
        creditAmount: 0,
        nextAmount: 54.99,
        remainingDays: 15,
        totalDays: 30,
        billingCycle: 'monthly'
    },
    visitCarryover: {
        currentVisitsPerMonth: 1,
        newVisitsPerMonth: 1,
        unusedVisits: 0,
        carryoverVisits: 0,
        totalVisitsNextPeriod: 1
    },
    effectiveDate: new Date().toISOString()
};

describe('PlanUpgradeModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        currentTier: 'STARTER',
        targetTier: 'HOMECARE',
        billingCycle: 'monthly' as const,
        onPlanChanged: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render modal when open', () => {
        (api.getPlanChangePreview as any).mockResolvedValue({
            success: true,
            preview: mockPreview
        });

        render(<PlanUpgradeModal {...defaultProps} />);

        expect(screen.getByText('Upgrade Plan')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
        render(<PlanUpgradeModal {...defaultProps} isOpen={false} />);

        expect(screen.queryByText('Upgrade Plan')).not.toBeInTheDocument();
    });

    it('should fetch preview on open', async () => {
        (api.getPlanChangePreview as any).mockResolvedValue({
            success: true,
            preview: mockPreview
        });

        render(<PlanUpgradeModal {...defaultProps} />);

        await waitFor(() => {
            expect(api.getPlanChangePreview).toHaveBeenCalledWith('HOMECARE', 'monthly');
        });
    });

    it('should display loading state', () => {
        (api.getPlanChangePreview as any).mockImplementation(() => new Promise(() => { }));

        render(<PlanUpgradeModal {...defaultProps} />);

        expect(screen.getByText('Loading preview...')).toBeInTheDocument();
    });

    it('should display plan comparison', async () => {
        (api.getPlanChangePreview as any).mockResolvedValue({
            success: true,
            preview: mockPreview
        });

        render(<PlanUpgradeModal {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText('Starter Plan')).toBeInTheDocument();
            expect(screen.getByText('HomeCare Plan')).toBeInTheDocument();
        });
    });

    it('should display billing preview for upgrades', async () => {
        (api.getPlanChangePreview as any).mockResolvedValue({
            success: true,
            preview: mockPreview
        });

        render(<PlanUpgradeModal {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText('Billing Preview')).toBeInTheDocument();
            expect(screen.getByText('Immediate Charge')).toBeInTheDocument();
            expect(screen.getByText('$16.50')).toBeInTheDocument();
        });
    });

    it('should display restrictions when plan change is not allowed', async () => {
        const restrictedPreview = {
            ...mockPreview,
            canChange: false,
            restrictions: ['Emergency service has been used this billing cycle']
        };

        (api.getPlanChangePreview as any).mockResolvedValue({
            success: true,
            preview: restrictedPreview
        });

        render(<PlanUpgradeModal {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText('Cannot Change Plan')).toBeInTheDocument();
            expect(screen.getByText('• Emergency service has been used this billing cycle')).toBeInTheDocument();
        });
    });

    it('should handle plan change confirmation', async () => {
        (api.getPlanChangePreview as any).mockResolvedValue({
            success: true,
            preview: mockPreview
        });

        (api.changePlan as any).mockResolvedValue({
            success: true,
            message: 'Plan upgraded successfully'
        });

        render(<PlanUpgradeModal {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText('Confirm Upgrade')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Confirm Upgrade'));

        await waitFor(() => {
            expect(api.changePlan).toHaveBeenCalledWith('HOMECARE', 'monthly');
            expect(defaultProps.onPlanChanged).toHaveBeenCalled();
        });
    });

    it('should disable confirm button when change is not allowed', async () => {
        const restrictedPreview = {
            ...mockPreview,
            canChange: false,
            restrictions: ['Emergency service has been used this billing cycle']
        };

        (api.getPlanChangePreview as any).mockResolvedValue({
            success: true,
            preview: restrictedPreview
        });

        render(<PlanUpgradeModal {...defaultProps} />);

        await waitFor(() => {
            const confirmButton = screen.getByText('Confirm Upgrade');
            expect(confirmButton).toBeDisabled();
        });
    });

    it('should handle close button', () => {
        (api.getPlanChangePreview as any).mockResolvedValue({
            success: true,
            preview: mockPreview
        });

        render(<PlanUpgradeModal {...defaultProps} />);

        fireEvent.click(screen.getByRole('button', { name: /close/i }));

        expect(defaultProps.onClose).toHaveBeenCalled();
    });
});