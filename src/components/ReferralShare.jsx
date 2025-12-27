import React, { useEffect, useState } from 'react';
import { Copy, Share2, Check } from 'lucide-react';
import { 
  useReferralCode, 
  useReferralStats, 
  useGenerateReferralCode,
  useShareReferral,
  useLoadReferralStats 
} from '../stores';
import { useUser, useAuthStore } from '../stores';
import { isGuestUser } from '../utils/authUtils';
import { t } from '../utils/translations';
import toast from 'react-hot-toast';

/**
 * ReferralShare Component
 * Displays referral code and sharing options
 */
const ReferralShare = ({ productId = null, onClose }) => {
  const user = useUser();
  const loginMethod = useAuthStore((state) => state.loginMethod);
  const isGuest = isGuestUser(user, loginMethod);
  const referralCode = useReferralCode();
  const referralStats = useReferralStats();
  const generateReferralCode = useGenerateReferralCode();
  const shareReferral = useShareReferral();
  const loadReferralStats = useLoadReferralStats();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Hide referral share component for guests
  if (!user || isGuest) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Invite Friends</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            {t('referral.onlyForRegistered')}
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    let isMounted = true;
    
    const loadCode = async () => {
      if (!referralCode) {
        setLoading(true);
        setError(null);
        
        try {
          const result = await generateReferralCode();
          if (isMounted) {
            if (!result.success) {
              const errorMsg = result.error || 'Failed to generate referral code';
              setError(errorMsg);
              toast.error(errorMsg);
            } else {
              setError(null);
            }
            setLoading(false);
          }
        } catch (err) {
          if (isMounted) {
            const errorMsg = err.message || 'Failed to generate referral code';
            setError(errorMsg);
            toast.error(errorMsg);
            setLoading(false);
          }
        }
      } else {
        setLoading(false);
        setError(null);
        loadReferralStats();
      }
    };
    
    // Small delay to prevent race conditions
    const timeoutId = setTimeout(loadCode, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [referralCode, generateReferralCode, loadReferralStats]);

  const handleCopyCode = async () => {
    if (!referralCode) {
      const result = await generateReferralCode();
      if (!result.success) {
        toast.error('Failed to generate referral code');
        return;
      }
    }

    const link = shareReferral(productId);
    if (link) {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success(t('referral.referralLinkCopied'));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!referralCode) {
      const result = await generateReferralCode();
      if (!result.success) {
        toast.error('Failed to generate referral code');
        return;
      }
    }

    const link = shareReferral(productId);
    const shareText = productId 
      ? `Join this group buy with my referral link and we both get credits! ${link}`
      : `Join our community commerce app and get $3 credit on your first order! Use my referral: ${link}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: t('referral.joinCommunityCommerce'),
          text: shareText,
          url: link
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          // Fallback to copy if share fails
          await navigator.clipboard.writeText(link);
          toast.success(t('referral.referralLinkCopied'));
        }
      }
    } else {
      // Fallback to copy
      await navigator.clipboard.writeText(link);
      toast.success(t('referral.referralLinkCopied'));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">{t('referral.inviteFriends')}</h3>
      
      {/* Referral Code Display */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('referral.yourReferralCode')}
        </label>
        {error && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 font-mono text-lg font-semibold">
            {loading ? t('referral.generating') : referralCode || (error ? t('referral.failedToGenerate') : t('referral.noCodeAvailable'))}
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[48px] disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={!referralCode || copied || loading}
          >
            {copied ? (
              <>
                <Check size={20} />
                <span>{t('referral.copied')}</span>
              </>
            ) : (
              <>
                <Copy size={20} />
                <span>{t('referral.copy')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors min-h-[48px] font-semibold mb-6 disabled:bg-gray-400 disabled:cursor-not-allowed"
        disabled={!referralCode || loading}
      >
        <Share2 size={20} />
        <span>{t('referral.shareReferralLink')}</span>
      </button>

      {/* Referral Stats */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('referral.yourReferralStats')}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {referralStats.totalReferrals || 0}
            </div>
            <div className="text-sm text-gray-600">{t('referral.totalReferrals')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {referralStats.successfulReferrals || 0}
            </div>
            <div className="text-sm text-gray-600">{t('referral.successful')}</div>
          </div>
          <div className="text-center col-span-2">
            <div className="text-xl font-bold text-purple-600">
              ${(referralStats.totalCreditsEarned || 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">{t('referral.creditsEarned')}</div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>{t('referral.howItWorks')}</strong> {t('referral.howItWorksDescription')}
        </p>
      </div>
    </div>
  );
};

export default ReferralShare;

