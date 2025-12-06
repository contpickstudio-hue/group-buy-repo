import { describe, it, expect } from 'vitest';

// Simple utility functions to test
export const formatPrice = (price) => {
  if (typeof price !== 'number' || isNaN(price) || !isFinite(price)) {
    return '$0.00';
  }
  return `$${price.toFixed(2)}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return 'No date';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid date';
  }
};

export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const truncateText = (text, maxLength = 100) => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength).trim() + '...';
};

describe('Utility Functions', () => {
  describe('formatPrice', () => {
    it('should format valid numbers correctly', () => {
      expect(formatPrice(25.99)).toBe('$25.99');
      expect(formatPrice(100)).toBe('$100.00');
      expect(formatPrice(0)).toBe('$0.00');
      expect(formatPrice(0.5)).toBe('$0.50');
    });

    it('should handle invalid inputs', () => {
      expect(formatPrice(null)).toBe('$0.00');
      expect(formatPrice(undefined)).toBe('$0.00');
      expect(formatPrice('invalid')).toBe('$0.00');
      expect(formatPrice(NaN)).toBe('$0.00');
    });

    it('should handle edge cases', () => {
      expect(formatPrice(-5)).toBe('$-5.00');
      expect(formatPrice(Infinity)).toBe('$0.00');
      expect(formatPrice(-Infinity)).toBe('$0.00');
    });
  });

  describe('formatDate', () => {
    it('should format valid date strings', () => {
      expect(formatDate('2023-12-25T12:00:00Z')).toBe('Dec 25, 2023');
      expect(formatDate('2023-01-01T12:00:00Z')).toMatch(/Jan 1, 2023/);
    });

    it('should handle invalid dates', () => {
      expect(formatDate('')).toBe('No date');
      expect(formatDate(null)).toBe('No date');
      expect(formatDate(undefined)).toBe('No date');
      expect(formatDate('invalid-date')).toBe('Invalid date');
    });

    it('should handle Date objects', () => {
      const date = new Date('2023-12-25T12:00:00Z');
      expect(formatDate(date.toISOString())).toBe('Dec 25, 2023');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('test+tag@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test.example.com')).toBe(false);
    });

    it('should handle non-string inputs', () => {
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail(undefined)).toBe(false);
      expect(validateEmail(123)).toBe(false);
      expect(validateEmail({})).toBe(false);
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should generate string IDs', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const longText = 'This is a very long text that should be truncated because it exceeds the maximum length limit';
      const result = truncateText(longText, 50);
      
      expect(result.length).toBeLessThanOrEqual(53); // 50 + '...' = 53
      expect(result.endsWith('...')).toBe(true);
    });

    it('should not truncate short text', () => {
      const shortText = 'Short text';
      expect(truncateText(shortText, 50)).toBe('Short text');
    });

    it('should handle edge cases', () => {
      expect(truncateText('', 10)).toBe('');
      expect(truncateText(null)).toBe('');
      expect(truncateText(undefined)).toBe('');
      expect(truncateText('test', 0)).toBe('...');
    });

    it('should use default max length', () => {
      const longText = 'a'.repeat(150);
      const result = truncateText(longText);
      
      expect(result.length).toBeLessThanOrEqual(103); // 100 + '...'
      expect(result.endsWith('...')).toBe(true);
    });
  });
});
