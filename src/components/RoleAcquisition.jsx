import React, { useState } from 'react';
import { Store, HandHeart, ShoppingCart, CheckCircle, X, AlertCircle } from 'lucide-react';
import { useUser, useAuthStore, useSetUser } from '../stores';
import { requestRole, removeRole, getCurrentUser } from '../services/supabaseService';
import { setStorageItem } from '../utils/storageUtils';
import { StorageKeys } from '../services/supabaseService';
import { isGuestUser } from '../utils/authUtils';
import toast from 'react-hot-toast';
import { t } from '../utils/translations';

/**
 * Role Acquisition Component
 * Allows registered users to request roles (Vendor / Helper)
 * Clearly explains what each role unlocks
 * Prevents role switching without confirmation
 */
const RoleAcquisition = () => {
    const user = useUser();
    const loginMethod = useAuthStore((state) => state.loginMethod);
    const setUser = useSetUser();
    const [requestingRole, setRequestingRole] = useState(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(null);
    const [roleToRemove, setRoleToRemove] = useState(null);

    const isGuest = isGuestUser(user, loginMethod);

    // Don't show for guests
    if (!user || isGuest) {
        return null;
    }

    const currentRoles = Array.isArray(user.roles) ? user.roles : [];
    const hasVendorRole = currentRoles.includes('vendor');
    const hasHelperRole = currentRoles.includes('helper');
    const hasCustomerRole = currentRoles.includes('customer');
    
    // Show customer role first, then vendor, then helper
    const roleOrder = ['customer', 'vendor', 'helper'];

    // Role definitions with what they unlock
    const roleDefinitions = {
        vendor: {
            icon: Store,
            title: t('roleAcquisition.vendorTitle') || 'Vendor',
            description: t('roleAcquisition.vendorDescription') || 'Create and manage group buys for your community.',
            unlocks: [
                t('roleAcquisition.vendorUnlock1') || 'Create group buy listings',
                t('roleAcquisition.vendorUnlock2') || 'Manage regional batches and pricing',
                t('roleAcquisition.vendorUnlock3') || 'Track orders and analytics',
                t('roleAcquisition.vendorUnlock4') || 'Access payout settings'
            ],
            color: 'purple'
        },
        helper: {
            icon: HandHeart,
            title: t('roleAcquisition.helperTitle') || 'Helper',
            description: t('roleAcquisition.helperDescription') || 'Help community members with errands and tasks.',
            unlocks: [
                t('roleAcquisition.helperUnlock1') || 'Apply to errands',
                t('roleAcquisition.helperUnlock2') || 'Earn money by completing tasks',
                t('roleAcquisition.helperUnlock3') || 'Build your helper profile',
                t('roleAcquisition.helperUnlock4') || 'Get verified helper status'
            ],
            color: 'green'
        },
        customer: {
            icon: ShoppingCart,
            title: t('roleAcquisition.customerTitle') || 'Customer',
            description: t('roleAcquisition.customerDescription') || 'Join group buys and post errands.',
            unlocks: [
                t('roleAcquisition.customerUnlock1') || 'Join group buys',
                t('roleAcquisition.customerUnlock2') || 'Post errands',
                t('roleAcquisition.customerUnlock3') || 'Track your orders',
                t('roleAcquisition.customerUnlock4') || 'Earn referral credits'
            ],
            color: 'blue'
        }
    };

    const handleRequestRole = async (role) => {
        if (requestingRole) return; // Prevent double-clicks

        setRequestingRole(role);
        try {
            const result = await requestRole(role);
            if (result.success) {
                // Refresh user data from database
                const { user: updatedUser } = await getCurrentUser();
                if (updatedUser) {
                    const userProfile = {
                        id: updatedUser.id,
                        email: updatedUser.email,
                        name: updatedUser.user_metadata?.name || updatedUser.email?.split('@')[0] || 'User',
                        roles: Array.isArray(updatedUser.user_metadata?.roles) 
                            ? updatedUser.user_metadata.roles 
                            : [],
                        helperVerified: updatedUser.user_metadata?.helperVerified === true
                    };
                    setUser(userProfile);
                    // Persist to storage for consistency
                    await setStorageItem(StorageKeys.user, userProfile);
                }
                setShowConfirmDialog(null);
            }
        } catch (error) {
            toast.error(error.message || `Failed to request ${role} role`);
        } finally {
            setRequestingRole(null);
        }
    };

    const handleRemoveRole = async (role) => {
        if (requestingRole) return;

        setRequestingRole(role);
        try {
            const result = await removeRole(role);
            if (result.success) {
                // Refresh user data from database
                const { user: updatedUser } = await getCurrentUser();
                if (updatedUser) {
                    const userProfile = {
                        id: updatedUser.id,
                        email: updatedUser.email,
                        name: updatedUser.user_metadata?.name || updatedUser.email?.split('@')[0] || 'User',
                        roles: Array.isArray(updatedUser.user_metadata?.roles) 
                            ? updatedUser.user_metadata.roles 
                            : [],
                        helperVerified: updatedUser.user_metadata?.helperVerified === true
                    };
                    setUser(userProfile);
                    // Persist to storage for consistency
                    await setStorageItem(StorageKeys.user, userProfile);
                }
                setRoleToRemove(null);
            }
        } catch (error) {
            toast.error(error.message || `Failed to remove ${role} role`);
        } finally {
            setRequestingRole(null);
        }
    };

    const handleConfirmRequest = (role) => {
        setShowConfirmDialog(role);
    };

    const handleConfirmRemove = (role) => {
        setRoleToRemove(role);
    };

    const getColorClasses = (color) => {
        const colors = {
            purple: {
                bg: 'bg-purple-50',
                border: 'border-purple-200',
                text: 'text-purple-700',
                button: 'bg-purple-600 hover:bg-purple-700',
                icon: 'text-purple-600'
            },
            green: {
                bg: 'bg-green-50',
                border: 'border-green-200',
                text: 'text-green-700',
                button: 'bg-green-600 hover:bg-green-700',
                icon: 'text-green-600'
            },
            blue: {
                bg: 'bg-blue-50',
                border: 'border-blue-200',
                text: 'text-blue-700',
                button: 'bg-blue-600 hover:bg-blue-700',
                icon: 'text-blue-600'
            }
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('roleAcquisition.title') || 'Available Roles'}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    {t('roleAcquisition.subtitle') || 'Request roles to unlock additional features. You can have multiple roles.'}
                </p>
            </div>

            {/* Role Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roleOrder.map((roleKey) => {
                    const roleDef = roleDefinitions[roleKey];
                    if (!roleDef) return null;
                    const hasRole = currentRoles.includes(roleKey);
                    const Icon = roleDef.icon;
                    const colors = getColorClasses(roleDef.color);
                    const isRequesting = requestingRole === roleKey;

                    return (
                        <div
                            key={roleKey}
                            className={`border rounded-lg p-6 ${hasRole ? colors.bg : 'bg-white'} ${colors.border}`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${hasRole ? colors.bg : 'bg-gray-100'}`}>
                                        <Icon className={`w-6 h-6 ${hasRole ? colors.icon : 'text-gray-600'}`} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{roleDef.title}</h4>
                                        {hasRole && (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 mt-1">
                                                <CheckCircle className="w-3 h-3" />
                                                {t('roleAcquisition.active') || 'Active'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 mb-4">{roleDef.description}</p>

                            {/* What this role unlocks */}
                            <div className="mb-4">
                                <p className="text-xs font-medium text-gray-700 mb-2">
                                    {t('roleAcquisition.unlocks') || 'This role unlocks:'}
                                </p>
                                <ul className="space-y-1">
                                    {roleDef.unlocks.map((unlock, index) => (
                                        <li key={index} className="flex items-start gap-2 text-xs text-gray-600">
                                            <CheckCircle className={`w-3 h-3 mt-0.5 flex-shrink-0 ${hasRole ? colors.icon : 'text-gray-400'}`} />
                                            <span>{unlock}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Action Button */}
                            {hasRole ? (
                                <button
                                    onClick={() => handleConfirmRemove(roleKey)}
                                    disabled={isRequesting}
                                    className={`w-full px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]`}
                                >
                                    {isRequesting ? t('roleAcquisition.removing') || 'Removing...' : t('roleAcquisition.removeRole') || 'Remove Role'}
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleConfirmRequest(roleKey)}
                                    disabled={isRequesting}
                                    className={`w-full px-4 py-2 text-sm font-medium text-white ${colors.button} rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]`}
                                >
                                    {isRequesting ? t('roleAcquisition.requesting') || 'Requesting...' : t('roleAcquisition.requestRole') || 'Request Role'}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Confirmation Dialog for Request */}
            {showConfirmDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <AlertCircle className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {t('roleAcquisition.confirmRequestTitle') || 'Confirm Role Request'}
                                </h3>
                                <p className="text-sm text-gray-600 mb-2">
                                    {t('roleAcquisition.confirmRequestMessage') || `Are you sure you want to request the ${roleDefinitions[showConfirmDialog]?.title} role?`}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {t('roleAcquisition.confirmRequestNote') || 'This will add the role to your account. You can remove it later if needed.'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmDialog(null)}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors min-h-[44px]"
                            >
                                {t('roleAcquisition.cancel') || 'Cancel'}
                            </button>
                            <button
                                onClick={() => handleRequestRole(showConfirmDialog)}
                                disabled={requestingRole === showConfirmDialog}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                            >
                                {requestingRole === showConfirmDialog 
                                    ? (t('roleAcquisition.requesting') || 'Requesting...')
                                    : (t('roleAcquisition.confirm') || 'Confirm')
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog for Remove */}
            {roleToRemove && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {t('roleAcquisition.confirmRemoveTitle') || 'Confirm Role Removal'}
                                </h3>
                                <p className="text-sm text-gray-600 mb-2">
                                    {t('roleAcquisition.confirmRemoveMessage') || `Are you sure you want to remove the ${roleDefinitions[roleToRemove]?.title} role?`}
                                </p>
                                <p className="text-xs text-red-600">
                                    {t('roleAcquisition.confirmRemoveWarning') || 'You will lose access to features associated with this role.'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setRoleToRemove(null)}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors min-h-[44px]"
                            >
                                {t('roleAcquisition.cancel') || 'Cancel'}
                            </button>
                            <button
                                onClick={() => handleRemoveRole(roleToRemove)}
                                disabled={requestingRole === roleToRemove}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                            >
                                {requestingRole === roleToRemove
                                    ? (t('roleAcquisition.removing') || 'Removing...')
                                    : (t('roleAcquisition.remove') || 'Remove')
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleAcquisition;

