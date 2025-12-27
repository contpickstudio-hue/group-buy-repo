/**
 * Authentication Utilities
 * Centralized authentication context handling
 * Ensures consistent auth state across the app, including demo/test users
 */

/**
 * Check if user is authenticated (including demo users)
 * @param {Object} user - User object from store
 * @returns {boolean}
 */
export function isAuthenticated(user) {
  return !!user && (!!user.email || !!user.id);
}

/**
 * Get user email, with fallback to id
 * @param {Object} user - User object from store
 * @returns {string|null}
 */
export function getUserEmail(user) {
  if (!user) return null;
  return user.email || user.id || null;
}

/**
 * Get user ID
 * @param {Object} user - User object from store
 * @returns {string|null}
 */
export function getUserId(user) {
  if (!user) return null;
  return user.id || user.email || null;
}

/**
 * Check if user has a specific role
 * @param {Object} user - User object from store
 * @param {string|string[]} roles - Role(s) to check
 * @returns {boolean}
 */
export function hasRole(user, roles) {
  if (!user || !user.roles) return false;
  const userRoles = Array.isArray(user.roles) ? user.roles : [];
  const rolesToCheck = Array.isArray(roles) ? roles : [roles];
  return rolesToCheck.some(role => userRoles.includes(role));
}

/**
 * Check if user has any of the specified roles
 * @param {Object} user - User object from store
 * @param {string[]} roles - Roles to check
 * @returns {boolean}
 */
export function hasAnyRole(user, roles) {
  return hasRole(user, roles);
}

/**
 * Check if user has all of the specified roles
 * @param {Object} user - User object from store
 * @param {string[]} roles - Roles to check
 * @returns {boolean}
 */
export function hasAllRoles(user, roles) {
  if (!user || !user.roles) return false;
  const userRoles = Array.isArray(user.roles) ? userRoles : [];
  return roles.every(role => userRoles.includes(role));
}

/**
 * Check if user is a demo/test user
 * @param {Object} user - User object from store
 * @param {string} loginMethod - Login method from store
 * @returns {boolean}
 */
export function isDemoUser(user, loginMethod) {
  return loginMethod === 'demo' || (user && user.email === 'test@demo.com');
}

/**
 * Validate user object structure
 * @param {Object} user - User object to validate
 * @returns {boolean}
 */
export function isValidUser(user) {
  if (!user) return false;
  return !!(user.email || user.id);
}

