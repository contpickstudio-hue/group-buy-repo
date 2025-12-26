import React, { useState } from 'react';
import { useUser } from '../stores';
import useCreateGroupBuyForm from '../hooks/useCreateGroupBuyForm';
import { getCurrentLocation, geocodeAddress } from '../services/geolocationService';
import toast from 'react-hot-toast';

const CreateGroupBuyForm = () => {
    const user = useUser();
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

    if (!user || !user.roles?.includes('vendor')) {
        return null;
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8" data-testid="create-product-form">
            <h3 className="text-xl font-semibold mb-4">Create Group Buy</h3>
            <form className="space-y-4" onSubmit={handleSubmit}>
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm">
                        {error}
                    </div>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                            Product Title
                        </label>
                        <input
                            id="title"
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g., Premium Korean Strawberries"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                            Price per Unit ($)
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
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Describe your product..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                            Region
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
                            Target Quantity
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
                        <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                            Deadline
                        </label>
                        <input
                            id="deadline"
                            type="date"
                            name="deadline"
                            value={formData.deadline}
                            onChange={handleChange}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                            required
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                        Image (Optional)
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
                    <p className="text-xs text-gray-500 mt-1">Upload a product image (optional)</p>
                </div>
                
                {/* Location Picker */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location (for map discovery)
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
                                Use Current Location
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
                                Search Address
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
                                            toast.success('Location set successfully');
                                        }
                                    } catch (error) {
                                        toast.error('Could not get location: ' + error.message);
                                    } finally {
                                        setLocationLoading(false);
                                    }
                                }}
                                disabled={locationLoading}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {locationLoading ? 'Getting location...' : 'Get Current Location'}
                            </button>
                        )}
                        
                        {locationMethod === 'address' && (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={addressInput}
                                    onChange={(e) => setAddressInput(e.target.value)}
                                    placeholder="Enter address..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!addressInput.trim()) {
                                            toast.error('Please enter an address');
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
                                                toast.success('Location found: ' + result.location.formattedAddress);
                                            }
                                        } catch (error) {
                                            toast.error('Could not find address: ' + error.message);
                                        } finally {
                                            setLocationLoading(false);
                                        }
                                    }}
                                    disabled={locationLoading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                                >
                                    {locationLoading ? 'Searching...' : 'Search'}
                                </button>
                            </div>
                        )}
                        
                        {(formData.latitude && formData.longitude) && (
                            <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                                ✓ Location set: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Adding a location helps users find your group buy on the map
                    </p>
                </div>
                
                <button
                    type="submit"
                    disabled={isSubmitting || !isFormValid}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Creating...' : 'Create Group Buy'}
                </button>
            </form>
        </div>
    );
};

export default CreateGroupBuyForm;

