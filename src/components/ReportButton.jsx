import React, { useState } from 'react';
import { Flag } from 'lucide-react';
import ReportModal from './ReportModal';

/**
 * Report Button Component
 * Displays a report button that opens a report modal
 */
const ReportButton = ({ reportType, targetId, targetTitle, className = '' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors min-h-[44px] min-w-[44px] ${className}`}
        aria-label="Report this item"
      >
        <Flag size={16} />
        <span className="hidden sm:inline">Report</span>
      </button>
      
      {isModalOpen && (
        <ReportModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          reportType={reportType}
          targetId={targetId}
          targetTitle={targetTitle}
        />
      )}
    </>
  );
};

export default ReportButton;

