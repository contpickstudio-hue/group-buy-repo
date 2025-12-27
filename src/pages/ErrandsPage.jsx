import React, { useState, useMemo } from 'react';
import { useErrands, useAddErrand, useUser, useUpdateErrandFilters, useAppStore, useAuthStore } from '../stores';
import toast from 'react-hot-toast';
import DateInput from '../components/DateInput';
import { isGuestUser } from '../utils/authUtils';
import SignUpCTA from '../components/SignUpCTA';
import { EmptyStateWithAction } from '../components/EmptyState';

const ErrandsPage = () => {
    // Hooks must be at top level - cannot be inside try-catch
    const errands = useErrands();
    const user = useUser();
    const loginMethod = useAuthStore((state) => state.loginMethod);
    const isGuest = isGuestUser(user, loginMethod);
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    
    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field when user starts typing
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };
    
    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Prevent duplicate submissions
        if (isSubmitting) {
            return;
        }
        
        if (!user) {
            toast.error('Please sign in to post an errand');
            return;
        }
        
        // Validate form
        const errors = {};
        if (!formData.title || !formData.title.trim()) {
            errors.title = 'Title is required';
        }
        if (!formData.description || !formData.description.trim()) {
            errors.description = 'Description is required';
        }
        if (formData.deadline) {
            const deadlineDate = new Date(formData.deadline);
            const now = new Date();
            if (isNaN(deadlineDate.getTime())) {
                errors.deadline = 'Invalid date format';
            } else if (deadlineDate < now) {
                errors.deadline = 'Deadline cannot be in the past';
            }
        }
        
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            toast.error('Please fix the errors in the form');
            return;
        }
        
        setIsSubmitting(true);
        setFormErrors({});
        
        const userEmail = user.email || user.id;
        // Parse budget properly - handle empty string, null, undefined
        const budgetValue = formData.budget 
          ? (typeof formData.budget === 'string' && formData.budget.trim() !== '' 
              ? parseFloat(formData.budget.trim()) 
              : (typeof formData.budget === 'number' ? formData.budget : 0))
          : 0;
        
        const newErrand = {
            title: formData.title.trim(),
            description: formData.description.trim(),
            region: formData.region,
            budget: isNaN(budgetValue) ? 0 : budgetValue,
            deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
            requester_email: userEmail, // For backend
            requesterEmail: userEmail, // For frontend
            status: 'open'
        };
        
        try {
            const result = await addErrand(newErrand);
            if (result && result.success) {
                toast.success('Errand posted successfully!');
                
                // Reset form
                setFormData({
                    title: '',
                    description: '',
                    region: 'Toronto',
                    budget: '',
                    deadline: ''
                });
                setFormErrors({});
            } else {
                throw new Error(result?.error || 'Failed to post errand');
            }
        } catch (error) {
            console.error('Error posting errand:', error);
            toast.error(error?.message || 'Failed to post errand. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
                        />
                    </div>
                    <select 
                        value={region}
                        onChange={(e) => updateErrandFilters({ region: e.target.value })}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
                    >
                        <option value="all">All Regions</option>
                        <option value="Toronto">Toronto</option>
                        <option value="Hamilton">Hamilton</option>
                        <option value="Niagara">Niagara</option>
                    </select>
                </div>
            </div>

            {/* Create Errand Form - Mobile optimized, single screen */}
            <div className="card mb-6 sm:mb-8 pb-24 sm:pb-6" data-testid="create-errand-form" data-coach-target="post-errand-form">
                <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">Post a New Errand</h3>
                {isGuest ? (
                    <SignUpCTA message="Sign up to post errands" />
                ) : (
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 pb-24 sm:pb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="e.g., Weekly H-Mart Grocery Run"
                            required
                            className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 text-base min-h-[44px] ${
                                formErrors.title 
                                    ? 'border-red-300 focus:ring-red-500' 
                                    : 'border-gray-300 focus:ring-blue-500'
                            }`}
                        />
                        {formErrors.title && (
                            <p className="mt-1 text-sm text-red-600" role="alert">
                                {formErrors.title}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="Describe what you need help with..."
                            required
                            className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 text-base min-h-[88px] ${
                                formErrors.description 
                                    ? 'border-red-300 focus:ring-red-500' 
                                    : 'border-gray-300 focus:ring-blue-500'
                            }`}
                        />
                        {formErrors.description && (
                            <p className="mt-1 text-sm text-red-600" role="alert">
                                {formErrors.description}
                            </p>
                        )}
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
                            />
                        </div>
                        <div>
                            <DateInput
                                name="deadline"
                                label="Deadline"
                                value={formData.deadline}
                                onChange={handleInputChange}
                                type="datetime-local"
                                min={new Date().toISOString().slice(0, 16)}
                                error={formErrors.deadline}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors font-semibold text-base min-h-[44px] disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Posting...</span>
                            </div>
                        ) : (
                            'Post Errand'
                        )}
                    </button>
                </form>
                )}
            </div>

            {/* Errands List */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <span className="text-gray-600">{filteredErrands.length} errands available</span>
                    <select 
                        value={sort}
                        onChange={(e) => updateErrandFilters({ sort: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
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
                                        errand.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                                        errand.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                        errand.status === 'awaiting_confirmation' ? 'bg-yellow-100 text-yellow-800' :
                                        errand.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                                        errand.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {errand.status === 'open' ? 'Open' :
                                         errand.status === 'assigned' ? 'Assigned' :
                                         errand.status === 'in_progress' ? 'In Progress' :
                                         errand.status === 'awaiting_confirmation' ? 'Awaiting Confirmation' :
                                         errand.status === 'completed' ? 'Completed' :
                                         errand.status === 'cancelled' ? 'Cancelled' :
                                         errand.status}
                                    </span>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-4 border-t border-gray-100">
                                    <button 
                                        onClick={() => {
                                            window.location.hash = `#errand/${errand.id}`;
                                        }}
                                        className="btn-secondary text-sm sm:text-base py-3 w-full sm:w-auto min-h-[48px]"
                                    >
                                        View Details
                                    </button>
                                    {errand.status === 'open' && !errand.assignedHelperEmail && (
                                        <button 
                                            onClick={() => {
                                                window.location.hash = `#errand/${errand.id}`;
                                            }}
                                            className="btn-primary text-sm sm:text-base py-3 w-full sm:w-auto min-h-[48px]"
                                        >
                                            Apply to Help
                                        </button>
                                    )}
                                    {errand.status === 'assigned' || errand.status === 'in_progress' || (errand.assignedHelperEmail && errand.status !== 'completed' && errand.status !== 'cancelled') ? (
                                        <span className="text-sm text-gray-600 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                            </svg>
                                            Locked
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card-empty animate-fade-in">
                        <EmptyStateWithAction 
                            type="errands"
                            message="No errands available"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ErrandsPage;
