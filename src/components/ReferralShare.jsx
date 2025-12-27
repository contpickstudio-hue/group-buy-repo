import React, { useEffect, useState } from 'react';
import { Copy, Share2, Check } from 'lucide-react';
import { 
  useReferralCode, 
  useReferralStats, 
  useGenerateReferralCode,
  useShareReferral,
  useLoadReferralStats 
} from '../stores';
import toast from 'react-hot-toast';

/**
 * ReferralShare Component
 * Displays referral code and sharing options
 */
const ReferralShare = ({ productId = null, onClose }) => {
  const referralCode = useReferralCode();
  const referralStats = useReferralStats();
  const generateReferralCode = useGenerateReferralCode();
  const shareReferral = useShareReferral();
  const loadReferralStats = useLoadReferralStats();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!referralCode) {
      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(async () => {
        const result = await generateReferralCode();
        if (!result.success) {
          toast.error(result.error || 'Failed to generate referral code');
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
    loadReferralStats();
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
      toast.success('Referral link copied!');
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
          title: 'Join our Community Commerce',
          text: shareText,
          url: link
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          // Fallback to copy if share fails
          await navigator.clipboard.writeText(link);
          toast.success('Referral link copied!');
        }
      }
    } else {
      // Fallback to copy
      await navigator.clipboard.writeText(link);
      toast.success('Referral link copied!');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">Invite Friends</h3>
      
      {/* Referral Code Display */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Referral Code
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 font-mono text-lg font-semibold">
            {referralCode || 'Generating...'}
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[48px]"
            disabled={!referralCode || copied}
          >
            {copied ? (
              <>
                <Check size={20} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={20} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors min-h-[48px] font-semibold mb-6"
        disabled={!referralCode}
      >
        <Share2 size={20} />
        <span>Share Referral Link</span>
      </button>

      {/* Referral Stats */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Your Referral Stats</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {referralStats.totalReferrals || 0}
            </div>
            <div className="text-sm text-gray-600">Total Referrals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {referralStats.successfulReferrals || 0}
            </div>
            <div className="text-sm text-gray-600">Successful</div>
          </div>
          <div className="text-center col-span-2">
            <div className="text-xl font-bold text-purple-600">
              ${(referralStats.totalCreditsEarned || 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Credits Earned</div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>How it works:</strong> Share your referral link with friends. When they sign up and make their first order, you both earn credits!
        </p>
      </div>
    </div>
  );
};

export default ReferralShare;

