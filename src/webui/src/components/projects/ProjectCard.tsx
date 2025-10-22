import React from 'react';
import { type ProjectSummary } from '../../services/api/projectsApi';

interface ProjectCardProps {
  project: ProjectSummary;
  darkMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProjectCard({ project, darkMode, onEdit, onDelete }: ProjectCardProps): JSX.Element {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6 hover:shadow-lg transition-shadow`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
            {project.name}
          </h3>
          {project.description && (
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
              {project.description}
            </p>
          )}
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={onEdit}
            className={`p-2 rounded hover:${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
            title="Edit project"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className={`p-2 rounded hover:${darkMode ? 'bg-red-900/30' : 'bg-red-50'} text-red-600`}
            title="Delete project"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mb-1`}>Revisions</p>
          <p className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            {project.revisionCount}
          </p>
        </div>
        <div>
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mb-1`}>Active Version</p>
          <p className={`text-sm font-mono ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
            {project.activeVersionIdentifier || 'None'}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className={`flex items-center justify-between pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          <p>Created {formatDate(project.createdAt)}</p>
          {project.updatedAt !== project.createdAt && (
            <p>Updated {formatDate(project.updatedAt)}</p>
          )}
        </div>
        <a
          href={`#/projects/${project.id}`}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          View Details
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
}
