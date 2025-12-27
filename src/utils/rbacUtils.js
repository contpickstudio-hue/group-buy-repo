/**
 * Role-Based Access Control (RBAC) Utilities
 * Enforces access control at both route and action levels
 */

import { isGuestUser, hasRole } from './authUtils';
import { useAuthStore } from '../stores/authStore';

/**
 * Check if user has required role for an action
 * @param {Object} user - User object
 * @param {string} loginMethod - Login method ('demo', 'email', 'google')
 * @param {string} requiredRole - Required role ('vendor', 'customer', 'helper')
 * @returns {{ allowed: boolean, error: string|null }}
 */
export function checkPermission(user, loginMethod, requiredRole) {
  // Guest users have NO permissions
  if (isGuestUser(user, loginMethod)) {
    return {
      allowed: false,
      error: `Guest users cannot ${getActionDescription(requiredRole)}. Please sign up to continue.`
    };
  }

  // User must be authenticated
  if (!user) {
    return {
      allowed: false,
      error: `Please sign in to ${getActionDescription(requiredRole)}.`
    };
  }

  // Check if user has the required role
  if (!hasRole(user, requiredRole, loginMethod)) {
    return {
      allowed: false,
      error: getPermissionDeniedMessage(requiredRole)
    };
  }

  return { allowed: true, error: null };
}

/**
 * Get user-friendly permission denied message
 * @param {string} requiredRole - Required role
 * @returns {string}
 */
function getPermissionDeniedMessage(requiredRole) {
  const messages = {
    vendor: 'Only vendors can create group buys. Please upgrade your account to vendor status to create group buys.',
    customer: 'Only customers can join group buys. Please ensure you have customer role assigned to your account.',
    helper: 'Only verified helpers can apply to errands. Please complete helper verification to apply.'
  };
  return messages[requiredRole] || 'You do not have permission to perform this action.';
}

/**
 * Get action description for user-friendly error messages
 * @param {string} role - Role
 * @returns {string}
 */
function getActionDescription(role) {
  const descriptions = {
    vendor: 'create group buys',
    customer: 'join group buys',
    helper: 'apply to errands'
  };
  return descriptions[role] || 'perform this action';
}

/**
 * Hook-like function to check permission (for use in components)
 * @param {string} requiredRole - Required role
 * @returns {{ allowed: boolean, error: string|null }}
 */
export function usePermissionCheck(requiredRole) {
  const user = useAuthStore.getState().user;
  const loginMethod = useAuthStore.getState().loginMethod;
  return checkPermission(user, loginMethod, requiredRole);
}

