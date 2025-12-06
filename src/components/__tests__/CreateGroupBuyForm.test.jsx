import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateGroupBuyForm from '../CreateGroupBuyForm';

// Mock the stores
const mockUser = {
    email: 'vendor@example.com',
    name: 'Test Vendor',
    roles: ['vendor']
};

const mockCreateProduct = vi.fn();

const mockUseUser = vi.fn(() => mockUser);
const mockUseCreateProduct = vi.fn(() => mockCreateProduct);

vi.mock('../../stores', () => ({
    useUser: () => mockUseUser(),
    useCreateProduct: () => mockUseCreateProduct(),
}));

describe('CreateGroupBuyForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCreateProduct.mockResolvedValue({ success: true });
    });

    it('should render the form with all fields', () => {
        render(<CreateGroupBuyForm />);
        
        expect(screen.getByRole('heading', { name: /create group buy/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/product title/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/price per unit/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/region/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/target quantity/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/deadline/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create group buy/i })).toBeInTheDocument();
    });

    it('should disable the submit button when form is empty', () => {
        render(<CreateGroupBuyForm />);
        
        const submitButton = screen.getByRole('button', { name: /create group buy/i });
        expect(submitButton).toBeDisabled();
    });

    it('should disable the submit button when title is missing', async () => {
        render(<CreateGroupBuyForm />);
        
        const priceInput = screen.getByLabelText(/price per unit/i);
        const submitButton = screen.getByRole('button', { name: /create group buy/i });
        
        // Fill only price, leave title empty
        fireEvent.change(priceInput, { target: { value: '25' } });
        
        expect(submitButton).toBeDisabled();
    });

    it('should disable the submit button when price is missing', async () => {
        render(<CreateGroupBuyForm />);
        
        const titleInput = screen.getByLabelText(/product title/i);
        const submitButton = screen.getByRole('button', { name: /create group buy/i });
        
        // Fill only title, leave price empty
        fireEvent.change(titleInput, { target: { value: 'Test Product' } });
        
        expect(submitButton).toBeDisabled();
    });

    it('should disable the submit button when price is zero or negative', async () => {
        render(<CreateGroupBuyForm />);
        
        const titleInput = screen.getByLabelText(/product title/i);
        const priceInput = screen.getByLabelText(/price per unit/i);
        const submitButton = screen.getByRole('button', { name: /create group buy/i });
        
        fireEvent.change(titleInput, { target: { value: 'Test Product' } });
        fireEvent.change(priceInput, { target: { value: '0' } });
        
        expect(submitButton).toBeDisabled();
        
        // Try negative
        fireEvent.change(priceInput, { target: { value: '-5' } });
        
        expect(submitButton).toBeDisabled();
    });

    it('should enable the submit button when title, price, and region are valid', async () => {
        render(<CreateGroupBuyForm />);
        
        const titleInput = screen.getByLabelText(/product title/i);
        const priceInput = screen.getByLabelText(/price per unit/i);
        const submitButton = screen.getByRole('button', { name: /create group buy/i });
        
        // Region has a default value, so it's already valid
        // Fill title and price
        fireEvent.change(titleInput, { target: { value: 'Test Product' } });
        fireEvent.change(priceInput, { target: { value: '25.99' } });
        
        await waitFor(() => {
            expect(submitButton).not.toBeDisabled();
        });
    });

    it('should keep button enabled when region is changed to valid value', async () => {
        render(<CreateGroupBuyForm />);
        
        const titleInput = screen.getByLabelText(/product title/i);
        const priceInput = screen.getByLabelText(/price per unit/i);
        const regionSelect = screen.getByLabelText(/region/i);
        const submitButton = screen.getByRole('button', { name: /create group buy/i });
        
        // Fill required fields
        fireEvent.change(titleInput, { target: { value: 'Test Product' } });
        fireEvent.change(priceInput, { target: { value: '25.99' } });
        
        await waitFor(() => {
            expect(submitButton).not.toBeDisabled();
        });
        
        // Change region - button should still be enabled
        fireEvent.change(regionSelect, { target: { value: 'Hamilton' } });
        
        expect(submitButton).not.toBeDisabled();
    });

    it('should disable button when title is cleared after being filled', async () => {
        render(<CreateGroupBuyForm />);
        
        const titleInput = screen.getByLabelText(/product title/i);
        const priceInput = screen.getByLabelText(/price per unit/i);
        const submitButton = screen.getByRole('button', { name: /create group buy/i });
        
        // Fill both fields
        fireEvent.change(titleInput, { target: { value: 'Test Product' } });
        fireEvent.change(priceInput, { target: { value: '25.99' } });
        
        await waitFor(() => {
            expect(submitButton).not.toBeDisabled();
        });
        
        // Clear title
        fireEvent.change(titleInput, { target: { value: '' } });
        
        await waitFor(() => {
            expect(submitButton).toBeDisabled();
        });
    });

    it('should disable button when price is cleared after being filled', async () => {
        render(<CreateGroupBuyForm />);
        
        const titleInput = screen.getByLabelText(/product title/i);
        const priceInput = screen.getByLabelText(/price per unit/i);
        const submitButton = screen.getByRole('button', { name: /create group buy/i });
        
        // Fill both fields
        fireEvent.change(titleInput, { target: { value: 'Test Product' } });
        fireEvent.change(priceInput, { target: { value: '25.99' } });
        
        await waitFor(() => {
            expect(submitButton).not.toBeDisabled();
        });
        
        // Clear price
        fireEvent.change(priceInput, { target: { value: '' } });
        
        await waitFor(() => {
            expect(submitButton).toBeDisabled();
        });
    });

    it('should disable button during form submission', async () => {
        // Mock a delayed response
        mockCreateProduct.mockImplementation(() => 
            new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
        );
        
        render(<CreateGroupBuyForm />);
        
        const titleInput = screen.getByLabelText(/product title/i);
        const priceInput = screen.getByLabelText(/price per unit/i);
        const deadlineInput = screen.getByLabelText(/deadline/i);
        const submitButton = screen.getByRole('button', { name: /create group buy/i });
        
        // Fill all required fields including deadline
        fireEvent.change(titleInput, { target: { value: 'Test Product' } });
        fireEvent.change(priceInput, { target: { value: '25.99' } });
        
        // Set a future date for deadline
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const dateString = futureDate.toISOString().split('T')[0];
        fireEvent.change(deadlineInput, { target: { value: dateString } });
        
        await waitFor(() => {
            expect(submitButton).not.toBeDisabled();
        });
        
        // Submit form
        fireEvent.click(submitButton);
        
        // Button should be disabled during submission
        await waitFor(() => {
            expect(submitButton).toBeDisabled();
            expect(screen.getByText('Creating...')).toBeInTheDocument();
        });
    });

    it('should not render form when user is not a vendor', () => {
        mockUseUser.mockReturnValueOnce({
            email: 'customer@example.com',
            name: 'Test Customer',
            roles: ['customer']
        });
        
        const { container } = render(<CreateGroupBuyForm />);
        
        expect(container.firstChild).toBeNull();
    });

    it('should not render form when user is null', () => {
        mockUseUser.mockReturnValueOnce(null);
        
        const { container } = render(<CreateGroupBuyForm />);
        
        expect(container.firstChild).toBeNull();
    });
});

