import React, { useState, useMemo } from 'react';
import { useErrands, useAddErrand, useUser, useUpdateErrandFilters, useAppStore } from '../stores';
import toast from 'react-hot-toast';

const ErrandsPage = () => {
    const errands = useErrands();
    const user = useUser();
    const addErrand = useAddErrand();
    const updateErrandFilters = useUpdateErrandFilters();
    
    // Get filter values from store
    const errandFilters = useAppStore((state) => state.filters?.errands || {});
    const search = errandFilters.search || '';
    const region = errandFilters.region || 'all';
    const category = errandFilters.category || 'all';
    const sort = errandFilters.sort || 'deadline';
    
    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        region: 'Toronto',
        budget: '',
        deadline: ''
    });
    
    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!user) {
            toast.error('Please sign in to post an errand');
            return;
        }
        
        if (!formData.title || !formData.description) {
            toast.error('Please fill in title and description');
            return;
        }
        
        const newErrand = {
            title: formData.title,
            description: formData.description,
            region: formData.region,
            budget: parseFloat(formData.budget) || 0,
            deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
            requester_email: user.email || user.id,
            status: 'open'
        };
        
        addErrand(newErrand);
        toast.success('Errand posted successfully!');
        
        // Reset form
        setFormData({
            title: '',
            description: '',
            region: 'Toronto',
            budget: '',
            deadline: ''
        });
    };
    
    // Filter and sort errands
    const filteredErrands = useMemo(() => {
        let filtered = [...errands];
        
        // Search filter
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(errand => 
                (errand.title || '').toLowerCase().includes(searchLower) ||
                (errand.description || '').toLowerCase().includes(searchLower)
            );
        }
        
        // Region filter
        if (region && region !== 'all') {
            filtered = filtered.filter(errand => errand.region === region);
        }
        
        // Sort
        filtered.sort((a, b) => {
            switch (sort) {
                case 'deadline':
                    const aDeadline = a.deadline ? new Date(a.deadline) : new Date(0);
                    const bDeadline = b.deadline ? new Date(b.deadline) : new Date(0);
                    return aDeadline - bDeadline;
                case 'budget-high':
                    return (b.budget || 0) - (a.budget || 0);
                case 'budget-low':
                    return (a.budget || 0) - (b.budget || 0);
                case 'newest':
                    const aCreated = a.createdAt ? new Date(a.createdAt) : new Date(0);
                    const bCreated = b.createdAt ? new Date(b.createdAt) : new Date(0);
                    return bCreated - aCreated;
                default:
                    return 0;
            }
        });
        
        return filtered;
    }, [errands, search, region, sort]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-8">
                <p className="text-gray-600 mb-2">Community assistance</p>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Errands & Tasks
                </h2>
                <p className="text-gray-600">
                    Help neighbors or get help with your tasks
                </p>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search errands..."
                            value={search}
                            onChange={(e) => updateErrandFilters({ search: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select 
                        value={region}
                        onChange={(e) => updateErrandFilters({ region: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Regions</option>
                        <option value="Toronto">Toronto</option>
                        <option value="Hamilton">Hamilton</option>
                        <option value="Niagara">Niagara</option>
                    </select>
                </div>
            </div>

            {/* Create Errand Form */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8" data-testid="create-errand-form">
                <h3 className="text-xl font-semibold mb-4">Post a New Errand</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="e.g., Weekly H-Mart Grocery Run"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="Describe what you need help with..."
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Region
                            </label>
                            <select 
                                name="region"
                                value={formData.region}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Toronto">Toronto</option>
                                <option value="Hamilton">Hamilton</option>
                                <option value="Niagara">Niagara</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Budget ($)
                            </label>
                            <input
                                type="number"
                                name="budget"
                                value={formData.budget}
                                onChange={handleInputChange}
                                min="1"
                                placeholder="25"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Deadline
                            </label>
                            <input
                                type="datetime-local"
                                name="deadline"
                                value={formData.deadline}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Post Errand
                    </button>
                </form>
            </div>

            {/* Errands List */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <span className="text-gray-600">{filteredErrands.length} errands available</span>
                    <select 
                        value={sort}
                        onChange={(e) => updateErrandFilters({ sort: e.target.value })}
                        className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="deadline">⏰ Deadline</option>
                        <option value="budget-high">💰 Budget: High to Low</option>
                        <option value="budget-low">💰 Budget: Low to High</option>
                        <option value="newest">✨ Newest</option>
                    </select>
                </div>

                {filteredErrands.length > 0 ? (
                    <div className="space-y-4">
                        {filteredErrands.map(errand => (
                            <div key={errand.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-2">{errand.title}</h3>
                                        <p className="text-gray-600 mb-3">{errand.description}</p>
                                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                            <span>📍 {errand.region || 'Unknown'}</span>
                                            <span>💰 ${errand.budget || 0}</span>
                                            {errand.deadline && (
                                                <span>⏰ {new Date(errand.deadline).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        errand.status === 'open' ? 'bg-green-100 text-green-800' :
                                        errand.status === 'matched' ? 'bg-yellow-100 text-yellow-800' :
                                        errand.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {errand.status}
                                    </span>
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors">
                                        View Details
                                    </button>
                                    {errand.status === 'open' && (
                                        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                                            Apply to Help
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500 mb-4">No errands available.</p>
                        <p className="text-gray-400">Be the first to post one!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ErrandsPage;
