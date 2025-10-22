import React from 'react';

interface DeleteConfirmModalProps {
  darkMode: boolean;
  projectName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({ darkMode, projectName, onClose, onConfirm }: DeleteConfirmModalProps): JSX.Element {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg max-w-md w-full p-6`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Delete Project
          </h2>
        </div>

        <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Are you sure you want to delete project <strong>"{projectName}"</strong>? This will permanently delete all revisions and their associated files. This action cannot be undone.
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Delete Project
          </button>
        </div>
      </div>
    </div>
  );
}
