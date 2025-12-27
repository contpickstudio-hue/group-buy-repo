import React, { useState, useEffect } from 'react';
import { useUser } from '../stores';
import { useAuthStore } from '../stores/authStore';
import { isGuestUser } from '../utils/authUtils';
import { getVendorWallet } from '../services/walletService';
import { 
  getPayoutMethods, 
  addPayoutMethod, 
  deletePayoutMethod, 
  setDefaultPayoutMethod,
  createWithdrawalRequest,
  getWithdrawalRequests,
  getMinimumWithdrawalAmount
} from '../services/payoutService';
import { DollarSign, Wallet, Clock, CheckCircle, Plus, Trash2, CreditCard, Building2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const PayoutSettingsPage = () => {
  const user = useUser();
  const loginMethod = useAuthStore((state) => state.loginMethod);
  const isGuest = isGuestUser(user, loginMethod);
  
  const [wallet, setWallet] = useState(null);
  const [payoutMethods, setPayoutMethods] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState(null);
  
  // Form state for adding payout method
  const [methodForm, setMethodForm] = useState({
    methodType: 'bank',
    methodName: '',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    accountHolderName: ''
  });

  const minimumWithdrawal = getMinimumWithdrawalAmount();

  // Load data on mount
  useEffect(() => {
    if (user && !isGuest) {
      loadData();
    }
  }, [user, isGuest]);

  const loadData = async () => {
    setLoading(true);
    try {
      const vendorEmail = user?.email || user?.id;
      
      const [walletResult, methodsResult, requestsResult] = await Promise.all([
        getVendorWallet(vendorEmail),
        getPayoutMethods(vendorEmail),
        getWithdrawalRequests(vendorEmail)
      ]);

      if (walletResult.success) {
        setWallet(walletResult.wallet);
      }

      if (methodsResult.success) {
        setPayoutMethods(methodsResult.methods);
        const defaultMethod = methodsResult.methods.find(m => m.isDefault);
        if (defaultMethod) {
          setSelectedMethodId(defaultMethod.id);
        } else if (methodsResult.methods.length > 0) {
          setSelectedMethodId(methodsResult.methods[0].id);
        }
      }

      if (requestsResult.success) {
        setWithdrawalRequests(requestsResult.requests);
      }
    } catch (error) {
      console.error('Error loading payout data:', error);
      toast.error('Failed to load payout data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMethod = async (e) => {
    e.preventDefault();
    
    if (!methodForm.methodName) {
      toast.error('Please enter a method name');
      return;
    }

    if (methodForm.methodType === 'bank') {
      if (!methodForm.bankName || !methodForm.accountNumber || !methodForm.routingNumber) {
        toast.error('Please fill in all bank details');
        return;
      }
    }

    try {
      const vendorEmail = user?.email || user?.id;
      const result = await addPayoutMethod(vendorEmail, {
        methodType: methodForm.methodType,
        methodName: methodForm.methodName,
        bankName: methodForm.bankName,
        accountNumber: methodForm.accountNumber,
        routingNumber: methodForm.routingNumber,
        accountHolderName: methodForm.accountHolderName,
        isDefault: payoutMethods.length === 0 // First method is default
      });

      if (result.success) {
        toast.success('Payout method added successfully');
        setShowAddMethod(false);
        setMethodForm({
          methodType: 'bank',
          methodName: '',
          bankName: '',
          accountNumber: '',
          routingNumber: '',
          accountHolderName: ''
        });
        await loadData();
      } else {
        throw new Error(result.error || 'Failed to add payout method');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to add payout method');
    }
  };

  const handleDeleteMethod = async (methodId) => {
    if (!window.confirm('Are you sure you want to delete this payout method?')) {
      return;
    }

    try {
      const result = await deletePayoutMethod(methodId);
      if (result.success) {
        toast.success('Payout method deleted');
        await loadData();
      } else {
        throw new Error(result.error || 'Failed to delete payout method');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete payout method');
    }
  };

  const handleSetDefault = async (methodId) => {
    try {
      const vendorEmail = user?.email || user?.id;
      const result = await setDefaultPayoutMethod(vendorEmail, methodId);
      if (result.success) {
        toast.success('Default payout method updated');
        await loadData();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to set default method');
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount < minimumWithdrawal) {
      toast.error(`Minimum withdrawal is $${minimumWithdrawal.toFixed(2)}`);
      return;
    }

    if (!selectedMethodId) {
      toast.error('Please select a payout method');
      return;
    }

    if (amount > (wallet?.availableBalance || 0)) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      const vendorEmail = user?.email || user?.id;
      const result = await createWithdrawalRequest(vendorEmail, amount, selectedMethodId);
      
      if (result.success) {
        toast.success('Withdrawal request submitted');
        setShowWithdraw(false);
        setWithdrawAmount('');
        await loadData();
      } else {
        throw new Error(result.error || 'Failed to create withdrawal request');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create withdrawal request');
    }
  };

  if (isGuest) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">
            Guest Preview Access
          </h2>
          <p className="text-yellow-700 mb-4">
            Payout settings are only available to registered users. Please sign up to access this feature.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading payout settings...</span>
        </div>
      </div>
    );
  }

  const availableBalance = wallet?.availableBalance || 0;
  const pendingBalance = wallet?.pendingBalance || 0;
  const canWithdraw = availableBalance >= minimumWithdrawal;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payout Settings</h1>
        <p className="text-gray-600">Manage your earnings and payout methods</p>
      </div>

      {/* Wallet Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Available Balance</h3>
            <DollarSign size={20} className="text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${availableBalance.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Ready to withdraw</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Pending Balance</h3>
            <Clock size={20} className="text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${pendingBalance.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">In escrow (active group buys)</p>
        </div>
      </div>

      {/* Withdrawal Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Withdraw Funds</h2>
          {!showWithdraw && (
            <button
              onClick={() => setShowWithdraw(true)}
              disabled={!canWithdraw || payoutMethods.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Wallet size={18} />
              Request Withdrawal
            </button>
          )}
        </div>

        {!canWithdraw && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertCircle size={18} className="text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Minimum withdrawal: ${minimumWithdrawal.toFixed(2)}</p>
              <p>Your available balance must reach ${minimumWithdrawal.toFixed(2)} before you can withdraw.</p>
            </div>
          </div>
        )}

        {payoutMethods.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertCircle size={18} className="text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p>Please add a payout method before requesting a withdrawal.</p>
            </div>
          </div>
        )}

        {showWithdraw && (
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min={minimumWithdrawal}
                  max={availableBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Min: $${minimumWithdrawal.toFixed(2)}`}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Available: ${availableBalance.toFixed(2)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payout Method
              </label>
              <select
                value={selectedMethodId || ''}
                onChange={(e) => setSelectedMethodId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a payout method</option>
                {payoutMethods.map(method => (
                  <option key={method.id} value={method.id}>
                    {method.methodName} {method.isDefault && '(Default)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Submit Request
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowWithdraw(false);
                  setWithdrawAmount('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Payout Methods Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Payout Methods</h2>
          {!showAddMethod && (
            <button
              onClick={() => setShowAddMethod(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Add Method
            </button>
          )}
        </div>

        {showAddMethod && (
          <form onSubmit={handleAddMethod} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Method Type
              </label>
              <select
                value={methodForm.methodType}
                onChange={(e) => setMethodForm({ ...methodForm, methodType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="bank">Bank Account</option>
                <option value="stripe">Stripe (Coming Soon)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Method Name
              </label>
              <input
                type="text"
                value={methodForm.methodName}
                onChange={(e) => setMethodForm({ ...methodForm, methodName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Chase Checking"
                required
              />
            </div>

            {methodForm.methodType === 'bank' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={methodForm.bankName}
                    onChange={(e) => setMethodForm({ ...methodForm, bankName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={methodForm.accountNumber}
                    onChange={(e) => setMethodForm({ ...methodForm, accountNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Routing Number
                  </label>
                  <input
                    type="text"
                    value={methodForm.routingNumber}
                    onChange={(e) => setMethodForm({ ...methodForm, routingNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={methodForm.accountHolderName}
                    onChange={(e) => setMethodForm({ ...methodForm, accountHolderName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Method
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddMethod(false);
                  setMethodForm({
                    methodType: 'bank',
                    methodName: '',
                    bankName: '',
                    accountNumber: '',
                    routingNumber: '',
                    accountHolderName: ''
                  });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {payoutMethods.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CreditCard size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No payout methods added yet</p>
            <p className="text-sm">Add a payout method to receive withdrawals</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payoutMethods.map(method => (
              <div
                key={method.id}
                className={`p-4 border rounded-lg ${
                  method.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {method.methodType === 'bank' ? (
                        <Building2 size={18} className="text-gray-600" />
                      ) : (
                        <CreditCard size={18} className="text-gray-600" />
                      )}
                      <h3 className="font-medium text-gray-900">{method.methodName}</h3>
                      {method.isDefault && (
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    {method.methodType === 'bank' && (
                      <div className="text-sm text-gray-600 space-y-1">
                        {method.bankName && <p>Bank: {method.bankName}</p>}
                        {method.accountNumberMasked && <p>Account: {method.accountNumberMasked}</p>}
                        {method.accountHolderName && <p>Holder: {method.accountHolderName}</p>}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!method.isDefault && (
                      <button
                        onClick={() => handleSetDefault(method.id)}
                        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteMethod(method.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdrawal History */}
      {withdrawalRequests.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Withdrawal History</h2>
          <div className="space-y-3">
            {withdrawalRequests.map(request => (
              <div
                key={request.id}
                className="p-4 border border-gray-200 rounded-lg flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">
                      ${request.amount.toFixed(2)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      request.status === 'completed' ? 'bg-green-100 text-green-800' :
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  {request.requestedAt && (
                    <p className="text-xs text-gray-500">
                      {new Date(request.requestedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {request.status === 'completed' && (
                  <CheckCircle size={20} className="text-green-600" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutSettingsPage;
