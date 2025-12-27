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
 * @returns {boolean} True if user has admin role
 */
export function isAdmin(user) {
  if (!user) return false;
  const roles = user.roles || [];
  return Array.isArray(roles) ? roles.includes('admin') : false;
}

/**
 * Check if user has a specific role
 * @param {Object} user - User object
 * @param {string} role - Role to check
 * @returns {boolean} True if user has the role
 */
export function hasRole(user, role) {
  if (!user) return false;
  const roles = user.roles || [];
  return Array.isArray(roles) ? roles.includes(role) : false;
}
