import React, { useState, useMemo } from 'react';
import { useErrands, useAddErrand, useUser, useUpdateErrandFilters, useAppStore } from '../stores';
import toast from 'react-hot-toast';

const ErrandsPage = () => {
    try {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Header - Mobile optimized */}
            <div className="text-center mb-6 sm:mb-8 animate-fade-in">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold mb-3">
                    <span className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse-slow"></span>
                    Community assistance
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
                    Errands & Tasks
                </h1>
                <p className="text-gray-600 text-base sm:text-lg">
                    Help neighbors or get help with your tasks
                </p>
            </div>

            {/* Search and Filters - Mobile optimized */}
            <div className="card mb-6 sm:mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search errands..."
                            value={search}
                            onChange={(e) => updateErrandFilters({ search: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                        />
                    </div>
                    <select 
                        value={region}
                        onChange={(e) => updateErrandFilters({ region: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    >
                        <option value="all">All Regions</option>
                        <option value="Toronto">Toronto</option>
                        <option value="Hamilton">Hamilton</option>
                        <option value="Niagara">Niagara</option>
                    </select>
                </div>
            </div>

            {/* Create Errand Form - Mobile optimized, single screen */}
            <div className="card mb-6 sm:mb-8" data-testid="create-errand-form" data-coach-target="post-errand-form">
                <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">Post a New Errand</h3>
                <form onSubmit={handleSubmit} className="space-y-5">
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                        />
                    </div>
                    {/* Mobile-optimized: Stack fields on mobile, grid on desktop */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Region
                            </label>
                            <select 
                                name="region"
                                value={formData.region}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                                data-coach-target="region-filter"
                            >
                                <option value="Toronto">Toronto</option>
                                <option value="Hamilton">Hamilton</option>
                                <option value="Niagara">Niagara</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Budget ($)
                            </label>
                            <input
                                type="number"
                                name="budget"
                                value={formData.budget}
                                onChange={handleInputChange}
                                min="1"
                                placeholder="25"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Deadline
                            </label>
                            <input
                                type="datetime-local"
                                name="deadline"
                                value={formData.deadline}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors font-semibold text-base min-h-[48px]"
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
                    <div className="space-y-4 sm:space-y-6">
                        {filteredErrands.map((errand, index) => (
                            <div 
                                key={errand.id} 
                                className="card card-hover animate-scale-in"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1 pr-3">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="text-3xl sm:text-4xl flex-shrink-0">🤝</div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg sm:text-xl mb-2 text-gray-900 line-clamp-2">
                                                    {errand.title}
                                                </h3>
                                                <p className="text-gray-600 text-sm sm:text-base mb-4 line-clamp-3">
                                                    {errand.description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-3 sm:gap-4 text-sm">
                                            <div className="flex items-center gap-1.5 text-gray-600">
                                                <span>📍</span>
                                                <span className="font-medium">{errand.region || 'Unknown'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-green-600 font-semibold">
                                                <span>💰</span>
                                                <span>${errand.budget || 0}</span>
                                            </div>
                                            {errand.deadline && (
                                                <div className="flex items-center gap-1.5 text-gray-600">
                                                    <span>⏰</span>
                                                    <span>{new Date(errand.deadline).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 ${
                                        errand.status === 'open' ? 'bg-green-100 text-green-800' :
                                        errand.status === 'matched' ? 'bg-yellow-100 text-yellow-800' :
                                        errand.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {errand.status}
                                    </span>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-4 border-t border-gray-100">
                                    <button className="btn-secondary text-sm sm:text-base py-2.5 w-full sm:w-auto">
                                        View Details
                                    </button>
                                    {errand.status === 'open' && (
                                        <button className="btn-primary text-sm sm:text-base py-2.5 w-full sm:w-auto">
                                            Apply to Help
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card-empty text-center animate-fade-in">
                        <div className="text-6xl mb-4">🤝</div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            No errands available
                        </h3>
                        <p className="text-gray-500 text-sm sm:text-base">
                            Be the first to post one!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
    } catch (error) {
        console.error('ErrandsPage error:', error);
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                        Unable to Load Errands
                    </h3>
                    <p className="text-red-600 mb-4">
                        There was an error loading errands. Please try refreshing the page.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                    >
                        Refresh Page
                    </button>
                </div>
            </div>
        );
    }
};

export default ErrandsPage;
