import React from 'react';
import { type RevisionSummary } from '../../services/api/projectsApi';
import { RevisionStatusBadge } from './RevisionStatusBadge';
import { RevisionMetricsPanel } from './RevisionMetricsPanel';

interface RevisionCardProps {
  revision: RevisionSummary;
  projectId: number;
  darkMode: boolean;
  onSetActive: () => void;
  onEditComment: () => void;
  onDelete: () => void;
  onView3D: () => void;
}

export function RevisionCard({ revision, darkMode, onSetActive, onEditComment, onDelete, onView3D }: RevisionCardProps): JSX.Element {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4`}>
      <div className="flex items-start justify-between">
        {/* Main Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className={`text-lg font-semibold font-mono ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {revision.versionIdentifier}
            </h3>
            {revision.isActive && (
              <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded">
                Active
              </span>
            )}
            <RevisionStatusBadge status={revision.processingStatus} darkMode={darkMode} />
          </div>

          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} space-y-1`}>
            <p><strong>File:</strong> {revision.ifcFileName}</p>
            <p><strong>Uploaded:</strong> {formatDate(revision.uploadedAt)}</p>
            <p><strong>Elements:</strong> {revision.elementCount.toLocaleString()}</p>
            {revision.comment && (
              <p><strong>Comment:</strong> {revision.comment}</p>
            )}
            {revision.processingError && (
              <p className="text-red-600"><strong>Error:</strong> {revision.processingError}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 ml-4">
          {revision.processingStatus === 'Completed' && (
            <button
              onClick={onView3D}
              className={`px-3 py-1 rounded text-sm font-medium whitespace-nowrap flex items-center gap-1 ${
                darkMode
                  ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
              title="View in 3D viewer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
              </svg>
              View 3D
            </button>
          )}
          {!revision.isActive && revision.processingStatus === 'Completed' && (
            <button
              onClick={onSetActive}
              className={`px-3 py-1 rounded text-sm font-medium ${
                darkMode
                  ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
              title="Set as active revision"
            >
              Set Active
            </button>
          )}
          <button
            onClick={onEditComment}
            className={`px-3 py-1 rounded text-sm ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title="Edit comment"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className={`px-3 py-1 rounded text-sm hover:${darkMode ? 'bg-red-900/30' : 'bg-red-50'} text-red-600`}
            title="Delete revision"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Metrics Panel - Only show for completed or failed revisions */}
      {(revision.processingStatus === 'Completed' || revision.processingStatus === 'Failed') && (
        <RevisionMetricsPanel
          revisionId={revision.id}
          darkMode={darkMode}
          initiallyExpanded={false}
        />
      )}
    </div>
  );
}
