/**
 * Keyboard Handler Hook
 * Handles keyboard visibility and adjusts layout accordingly
 */

import { useEffect, useState } from 'react';

/**
 * Hook to handle keyboard visibility on mobile
 * Adds padding to prevent FAB from covering inputs
 */
export function useKeyboardHandler() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    // Detect keyboard visibility on mobile
    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      const heightDiff = windowHeight - viewportHeight;
      
      // If viewport is significantly smaller, keyboard is likely open
      if (heightDiff > 150) {
        setIsKeyboardVisible(true);
        setKeyboardHeight(heightDiff);
      } else {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    };

    // Use Visual Viewport API if available (better for mobile)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => {
        window.visualViewport?.removeEventListener('resize', handleResize);
      };
    } else {
      // Fallback to window resize
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  return { isKeyboardVisible, keyboardHeight };
}

/**
 * Hook to scroll input into view when focused
 */
export function useInputFocus() {
  useEffect(() => {
    const handleFocus = (e) => {
      // Only handle on mobile
      if (window.innerWidth < 768) {
        setTimeout(() => {
          const input = e.target;
          if (input && input.scrollIntoView) {
            input.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest'
            });
          }
        }, 300); // Delay to allow keyboard to appear
      }
    };

    // Add focus listeners to all inputs
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('focus', handleFocus);
    });

    return () => {
      inputs.forEach(input => {
        input.removeEventListener('focus', handleFocus);
      });
    };
  }, []);
}

