import React, { useState, useEffect } from 'react';
import { getProjects, deleteProject, type ProjectSummary } from '../services/api/projectsApi';
import { ProjectCard } from '../components/projects/ProjectCard';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { EditProjectModal } from '../components/projects/EditProjectModal';
import { DeleteConfirmModal } from '../components/projects/DeleteConfirmModal';

interface ProjectsPageProps {
  darkMode: boolean;
}

export function ProjectsPage({ darkMode }: ProjectsPageProps): JSX.Element {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectSummary | null>(null);
  const [deletingProject, setDeletingProject] = useState<ProjectSummary | null>(null);

  // Load projects
  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Handle project creation success
  const handleProjectCreated = () => {
    setShowCreateModal(false);
    loadProjects();
  };

  // Handle project update success
  const handleProjectUpdated = () => {
    setEditingProject(null);
    loadProjects();
  };

  // Handle project deletion
  const handleDeleteConfirm = async () => {
    if (!deletingProject) return;

    try {
      await deleteProject(deletingProject.id);
      setDeletingProject(null);
      loadProjects();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-white border-b border-gray-200'} px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage your BIM projects and IFC model revisions
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className={`inline-block animate-spin rounded-full h-12 w-12 border-b-2 ${darkMode ? 'border-gray-400' : 'border-gray-900'}`}></div>
            <p className={`mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading projects...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Error</p>
            <p>{error}</p>
            <button
              onClick={loadProjects}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && projects.length === 0 && (
          <div className={`text-center py-12 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg`}>
            <svg className={`mx-auto h-16 w-16 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <h3 className={`mt-4 text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
              No projects yet
            </h3>
            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Get started by creating your first BIM project
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Create Project
            </button>
          </div>
        )}

        {/* Projects Grid */}
        {!loading && !error && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                darkMode={darkMode}
                onEdit={() => setEditingProject(project)}
                onDelete={() => setDeletingProject(project)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateProjectModal
          darkMode={darkMode}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleProjectCreated}
        />
      )}

      {editingProject && (
        <EditProjectModal
          darkMode={darkMode}
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSuccess={handleProjectUpdated}
        />
      )}

      {deletingProject && (
        <DeleteConfirmModal
          darkMode={darkMode}
          projectName={deletingProject.name}
          onClose={() => setDeletingProject(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
