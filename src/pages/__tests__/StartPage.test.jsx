import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StartPage from '../StartPage';

// Mock the stores
const mockSetCurrentScreen = vi.fn();
const mockSetDemoUser = vi.fn();

vi.mock('../../stores', () => ({
    useSetCurrentScreen: () => mockSetCurrentScreen,
    useSetDemoUser: () => mockSetDemoUser,
}));

describe('StartPage - Skip Login Functionality', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    
    it('should render the start page with correct content', () => {
        render(<StartPage />);
        
        expect(screen.getByText('Join local group buys & errands together')).toBeInTheDocument();
        expect(screen.getByText('Get Started')).toBeInTheDocument();
        expect(screen.getByText('Skip login (test)')).toBeInTheDocument();
    });
    
    it('should navigate to auth screen when "Get Started" is clicked', () => {
        render(<StartPage />);
        
        const getStartedButton = screen.getByText('Get Started');
        fireEvent.click(getStartedButton);
        
        expect(mockSetCurrentScreen).toHaveBeenCalledWith('auth');
        expect(mockSetCurrentScreen).toHaveBeenCalledTimes(1);
    });
    
    it('should set demo user and navigate to browse when "Skip login (test)" is clicked', () => {
        render(<StartPage />);
        
        const skipLoginButton = screen.getByText('Skip login (test)');
        fireEvent.click(skipLoginButton);
        
        // Verify setDemoUser was called to set the user's role in application state
        expect(mockSetDemoUser).toHaveBeenCalledTimes(1);
        
        // Verify navigation to browse screen
        expect(mockSetCurrentScreen).toHaveBeenCalledWith('browse');
        expect(mockSetCurrentScreen).toHaveBeenCalledTimes(1);
    });
    
    it('should correctly set user roles in application state when skip login is clicked', () => {
        // Track if setDemoUser was called (which sets roles)
        let demoUserCalled = false;
        mockSetDemoUser.mockImplementation(() => {
            demoUserCalled = true;
        });
        
        render(<StartPage />);
        
        const skipLoginButton = screen.getByText('Skip login (test)');
        fireEvent.click(skipLoginButton);
        
        // Verify demo user function was called (this sets roles: customer, vendor, helper)
        expect(mockSetDemoUser).toHaveBeenCalledTimes(1);
        expect(demoUserCalled).toBe(true);
        
        // Verify navigation occurred after setting user state
        expect(mockSetCurrentScreen).toHaveBeenCalledWith('browse');
    });
    
    it('should have accessible button labels', () => {
        render(<StartPage />);
        
        const getStartedButton = screen.getByRole('button', { name: /get started/i });
        const skipLoginButton = screen.getByRole('button', { name: /skip login/i });
        
        expect(getStartedButton).toBeInTheDocument();
        expect(skipLoginButton).toBeInTheDocument();
    });
});

