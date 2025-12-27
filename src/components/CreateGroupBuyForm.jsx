import React, { useState, useEffect } from 'react';
import { useUser, useAuthStore } from '../stores';
import useCreateGroupBuyForm from '../hooks/useCreateGroupBuyForm';
import { getCurrentLocation, geocodeAddress } from '../services/geolocationService';
import toast from 'react-hot-toast';
import DateInput from './DateInput';
import { isGuestUser, hasRole } from '../utils/authUtils';
import SignUpCTA from './SignUpCTA';
import UpgradeToVendorCTA from './UpgradeToVendorCTA';
import { t } from '../utils/translations';

const CreateGroupBuyForm = () => {
    const user = useUser();
    const loginMethod = useAuthStore((state) => state.loginMethod);
    const isGuest = isGuestUser(user, loginMethod);
    const {
        formData,
        isSubmitting,
        error,
        isFormValid,
        handleChange,
        handleSubmit
    } = useCreateGroupBuyForm();
    
    const [locationMethod, setLocationMethod] = useState('current'); // 'current', 'address', 'map'
    const [addressInput, setAddressInput] = useState('');
    const [locationLoading, setLocationLoading] = useState(false);

    // Note: Toast notifications are now handled in the hook for better control
    // This useEffect is kept for backward compatibility but may not be needed

    // Show CTA for guest users instead of form
    if (!user || isGuest) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8" data-testid="create-product-form">
                <h3 className="text-xl font-semibold mb-4">{t('groupBuy.createTitle')}</h3>
                <SignUpCTA message={t('groupBuy.signUpToCreate')} />
            </div>
        );
    }

    // Enforce vendor role requirement - show upgrade CTA for non-vendors
    if (!hasRole(user, 'vendor')) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8" data-testid="create-product-form">
                <h3 className="text-xl font-semibold mb-4">{t('groupBuy.createTitle')}</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div className="text-sm text-red-800">
                            <p className="font-semibold">{t('groupBuy.accessDenied')}</p>
                            <p className="mt-1">{t('groupBuy.vendorRoleRequired')}</p>
                        </div>
                    </div>
                </div>
                <UpgradeToVendorCTA />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8" data-testid="create-product-form">
            <h3 className="text-xl font-semibold mb-4">{t('groupBuy.createTitle')}</h3>
            <form className="space-y-4 pb-24 sm:pb-6" onSubmit={handleSubmit}>
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm">
                        {error}
                    </div>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                            {t('groupBuy.productTitle')}
                        </label>
                        <input
                            id="title"
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder={t('groupBuy.productTitlePlaceholder')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                            {t('groupBuy.pricePerUnit')}
                        </label>
                        <input
                            id="price"
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            min="1"
                            step="0.01"
                            placeholder="38"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                            required
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('groupBuy.description')}
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        placeholder={t('groupBuy.descriptionPlaceholder')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                            {t('groupBuy.region')}
                        </label>
                        <select 
                            id="region"
                            name="region"
                            value={formData.region}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                        >
                            <option value="Toronto">Toronto</option>
                            <option value="Hamilton">Hamilton</option>
                            <option value="Niagara">Niagara</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="targetQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                            {t('groupBuy.targetQuantity')}
                        </label>
                        <input
                            id="targetQuantity"
                            type="number"
                            name="targetQuantity"
                            value={formData.targetQuantity}
                            onChange={handleChange}
                            min="5"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                            required
                        />
                    </div>
                    <div>
                        <DateInput
                            id="deadline"
                            name="deadline"
                            label={t('groupBuy.deadline')}
                            value={formData.deadline}
                            onChange={handleChange}
                            min={new Date().toISOString().split('T')[0]}
                            required
                            type="date"
                            error={error && (error.includes('deadline') || error.includes('Deadline')) ? error : null}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('groupBuy.image')}
                    </label>
                    <input
                        id="image"
                        type="file"
                        name="image"
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    handleChange({
                                        target: {
                                            name: 'imageDataUrl',
                                            value: reader.result
                                        }
                                    });
                                };
                                reader.readAsDataURL(file);
                            }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('groupBuy.uploadImage')}</p>
                </div>
                
                {/* Location Picker */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('groupBuy.location')}
                    </label>
                    <div className="space-y-3">
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setLocationMethod('current')}
                                    className={`px-3 py-2 text-sm rounded-md border ${
                                    locationMethod === 'current'
                                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {t('groupBuy.useCurrentLocation')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setLocationMethod('address')}
                                className={`px-3 py-2 text-sm rounded-md border ${
                                    locationMethod === 'address'
                                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {t('groupBuy.searchAddress')}
                            </button>
                        </div>
                        
                        {locationMethod === 'current' && (
                            <button
                                type="button"
                                onClick={async () => {
                                    setLocationLoading(true);
                                    try {
                                        const result = await getCurrentLocation();
                                        if (result.success && result.location) {
                                            handleChange({
                                                target: {
                                                    name: 'latitude',
                                                    value: result.location.latitude
                                                }
                                            });
                                            handleChange({
                                                target: {
                                                    name: 'longitude',
                                                    value: result.location.longitude
                                                }
                                            });
                                            toast.success(t('groupBuy.locationSet'));
                                        }
                                    } catch (error) {
                                        toast.error(t('groupBuy.locationError', { error: error.message }));
                                    } finally {
                                        setLocationLoading(false);
                                    }
                                }}
                                disabled={locationLoading}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {locationLoading ? t('groupBuy.gettingLocation') : t('groupBuy.getCurrentLocation')}
                            </button>
                        )}
                        
                        {locationMethod === 'address' && (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={addressInput}
                                    onChange={(e) => setAddressInput(e.target.value)}
                                    placeholder={t('groupBuy.enterAddress')}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!addressInput.trim()) {
                                            toast.error(t('groupBuy.enterAddressError'));
                                            return;
                                        }
                                        setLocationLoading(true);
                                        try {
                                            const result = await geocodeAddress(addressInput);
                                            if (result.success && result.location) {
                                                handleChange({
                                                    target: {
                                                        name: 'latitude',
                                                        value: result.location.latitude
                                                    }
                                                });
                                                handleChange({
                                                    target: {
                                                        name: 'longitude',
                                                        value: result.location.longitude
                                                    }
                                                });
                                                toast.success(t('groupBuy.locationFound', { address: result.location.formattedAddress }));
                                            }
                                        } catch (error) {
                                            toast.error(t('groupBuy.addressError', { error: error.message }));
                                        } finally {
                                            setLocationLoading(false);
                                        }
                                    }}
                                    disabled={locationLoading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                                >
                                    {locationLoading ? t('groupBuy.searching') : t('common.search')}
                                </button>
                            </div>
                        )}
                        
                        {(formData.latitude && formData.longitude) && (
                            <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                                {t('groupBuy.locationSetLabel', { lat: formData.latitude.toFixed(6), lng: formData.longitude.toFixed(6) })}
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        {t('groupBuy.locationHelp')}
                    </p>
                </div>
                
                <button
                    type="submit"
                    disabled={isSubmitting || !isFormValid}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400 disabled:opacity-60 relative min-h-[48px] font-semibold"
                >
                    {isSubmitting ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            <span>{t('groupBuy.creating')}</span>
                        </div>
                    ) : (
                        <span>{t('groupBuy.create')}</span>
                    )}
                    {isSubmitting && (
                        <span className="absolute inset-0 flex items-center justify-center bg-blue-600 bg-opacity-75 rounded-md">
                            <span className="sr-only">{t('groupBuy.submittingForm')}</span>
                        </span>
                    )}
                </button>
            </form>
        </div>
    );
};

export default CreateGroupBuyForm;

