import React from 'react';

interface RevisionStatusBadgeProps {
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  darkMode: boolean;
}

export function RevisionStatusBadge({ status, darkMode }: RevisionStatusBadgeProps): JSX.Element {
  const getStatusStyles = () => {
    switch (status) {
      case 'Completed':
        return darkMode
          ? 'bg-blue-900/30 text-blue-400 border-blue-700'
          : 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Processing':
        return darkMode
          ? 'bg-yellow-900/30 text-yellow-400 border-yellow-700'
          : 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Failed':
        return darkMode
          ? 'bg-red-900/30 text-red-400 border-red-700'
          : 'bg-red-100 text-red-700 border-red-300';
      case 'Pending':
      default:
        return darkMode
          ? 'bg-gray-700 text-gray-400 border-gray-600'
          : 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'Completed':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'Processing':
        return (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
        );
      case 'Failed':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <span className={`px-2 py-1 border text-xs font-medium rounded flex items-center gap-1 ${getStatusStyles()}`}>
      {getStatusIcon()}
      {status}
    </span>
  );
}
