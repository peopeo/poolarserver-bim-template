import React, { useState, useEffect } from 'react';
import { getProject, deleteRevision, setActiveRevision, type ProjectDetail, type RevisionSummary } from '../services/api/projectsApi';
import { RevisionCard } from '../components/revisions/RevisionCard';
import { UploadRevisionModal } from '../components/revisions/UploadRevisionModal';
import { UpdateCommentModal } from '../components/revisions/UpdateCommentModal';
import { DeleteRevisionConfirmModal } from '../components/revisions/DeleteRevisionConfirmModal';

interface ProjectDetailPageProps {
  darkMode: boolean;
  projectId: number;
  onBack: () => void;
  onViewRevisionIn3D?: (projectId: number, revisionId: number, viewerType: 'xeokit' | 'threejs' | 'babylon') => void;
}

export function ProjectDetailPage({ darkMode, projectId, onBack, onViewRevisionIn3D }: ProjectDetailPageProps): JSX.Element {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingRevision, setEditingRevision] = useState<RevisionSummary | null>(null);
  const [deletingRevision, setDeletingRevision] = useState<RevisionSummary | null>(null);

  // Load project details
  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProject(projectId);
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
    // Poll for updates every 5 seconds to check processing status
    const interval = setInterval(loadProject, 5000);
    return () => clearInterval(interval);
  }, [projectId]);

  // Handle revision upload success
  const handleRevisionUploaded = () => {
    setShowUploadModal(false);
    loadProject();
  };

  // Handle comment update success
  const handleCommentUpdated = () => {
    setEditingRevision(null);
    loadProject();
  };

  // Handle set active revision
  const handleSetActive = async (revisionId: number) => {
    try {
      await setActiveRevision(projectId, revisionId);
      loadProject();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to set active revision');
    }
  };

  // Handle revision deletion
  const handleDeleteConfirm = async () => {
    if (!deletingRevision) return;

    try {
      await deleteRevision(projectId, deletingRevision.id);
      setDeletingRevision(null);
      loadProject();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete revision');
    }
  };

  // Handle view in 3D viewers
  const handleViewXeokit = (revisionId: number) => {
    if (onViewRevisionIn3D) {
      onViewRevisionIn3D(projectId, revisionId, 'xeokit');
    }
  };

  const handleViewThreeJS = (revisionId: number) => {
    if (onViewRevisionIn3D) {
      onViewRevisionIn3D(projectId, revisionId, 'threejs');
    }
  };

  const handleViewBabylon = (revisionId: number) => {
    if (onViewRevisionIn3D) {
      onViewRevisionIn3D(projectId, revisionId, 'babylon');
    }
  };

  if (loading && !project) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`inline-block animate-spin rounded-full h-12 w-12 border-b-2 ${darkMode ? 'border-gray-400' : 'border-gray-900'}`}></div>
          <p className={`mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded">
            <p className="font-bold">Error</p>
            <p>{error || 'Project not found'}</p>
            <button onClick={onBack} className="mt-4 text-sm underline hover:no-underline">
              Back to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-white border-b border-gray-200'} px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className={`p-2 rounded hover:${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
              title="Back to projects"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              {project.description && (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {project.description}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload IFC
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Empty State */}
        {project.revisions.length === 0 && (
          <div className={`text-center py-12 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg`}>
            <svg className={`mx-auto h-16 w-16 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <h3 className={`mt-4 text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
              No revisions yet
            </h3>
            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Upload your first IFC file to get started
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Upload IFC File
            </button>
          </div>
        )}

        {/* Revisions List */}
        {project.revisions.length > 0 && (
          <div className="space-y-4">
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Revisions ({project.revisions.length})
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {project.revisions.map((revision) => (
                <RevisionCard
                  key={revision.id}
                  revision={revision}
                  projectId={projectId}
                  darkMode={darkMode}
                  onSetActive={() => handleSetActive(revision.id)}
                  onEditComment={() => setEditingRevision(revision)}
                  onDelete={() => setDeletingRevision(revision)}
                  onViewXeokit={() => handleViewXeokit(revision.id)}
                  onViewThreeJS={() => handleViewThreeJS(revision.id)}
                  onViewBabylon={() => handleViewBabylon(revision.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showUploadModal && (
        <UploadRevisionModal
          darkMode={darkMode}
          projectId={projectId}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleRevisionUploaded}
        />
      )}

      {editingRevision && (
        <UpdateCommentModal
          darkMode={darkMode}
          projectId={projectId}
          revision={editingRevision}
          onClose={() => setEditingRevision(null)}
          onSuccess={handleCommentUpdated}
        />
      )}

      {deletingRevision && (
        <DeleteRevisionConfirmModal
          darkMode={darkMode}
          revisionVersion={deletingRevision.versionIdentifier}
          onClose={() => setDeletingRevision(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
