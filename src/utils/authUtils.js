/**
 * Authentication Utilities
 * Helper functions for authentication and role management
 */

/**
 * Check if user is a guest (demo) user
 * @param {Object} user - User object
 * @param {string} loginMethod - Login method ('demo', 'email', 'google')
 * @returns {boolean} True if user is a guest
 */
export function isGuestUser(user, loginMethod) {
  return loginMethod === 'demo' || (user && (user.email === 'guest@preview.app' || user.email?.includes('guest-')));
}

/**
 * Check if user is an admin
 * @param {Object} user - User object
 * @param {string} loginMethod - Login method ('demo', 'email', 'google')
 * @returns {boolean} True if user has admin role
 */
export function isAdmin(user, loginMethod = null) {
  if (!user) return false;
  // Guest users have NO roles, including admin
  if (isGuestUser(user, loginMethod)) return false;
  const roles = user.roles || [];
  return Array.isArray(roles) ? roles.includes('admin') : false;
}

/**
 * Check if user has a specific role
 * @param {Object} user - User object
 * @param {string} role - Role to check
 * @param {string} loginMethod - Login method ('demo', 'email', 'google')
 * @returns {boolean} True if user has the role
 */
export function hasRole(user, role, loginMethod = null) {
  if (!user) return false;
  // Guest users have NO roles
  if (isGuestUser(user, loginMethod)) return false;
  const roles = user.roles || [];
  return Array.isArray(roles) ? roles.includes(role) : false;
}

/**
 * Get display name for user, replacing test/debug names with appropriate values
 * @param {Object} user - User object
 * @param {string} loginMethod - Login method ('demo', 'email', 'google', null)
 * @returns {string} Display name to show in UI
 */
export function getUserDisplayName(user, loginMethod = null) {
  if (!user) return 'Guest';
  
  const name = user.name;
  
  // If user is a guest/preview user, always return "Guest"
  if (isGuestUser(user, loginMethod)) {
    return 'Guest';
  }
  
  // Replace "Test User" with actual name from email or default
  if (name === 'Test User' || name === 'Guest User') {
    // Try to extract name from email
    if (user.email) {
      const emailName = user.email.split('@')[0];
      // If email name looks reasonable (not test/demo), use it
      if (emailName && !emailName.toLowerCase().includes('test') && !emailName.toLowerCase().includes('demo')) {
        return emailName.charAt(0).toUpperCase() + emailName.slice(1);
      }
    }
    // Default fallback
    return 'User';
  }
  
  // Return the actual name if it exists and is not test/debug
  if (name && name.trim()) {
    return name;
  }
  
  // Fallback: extract from email
  if (user.email) {
    const emailName = user.email.split('@')[0];
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }
  
  return 'User';
}