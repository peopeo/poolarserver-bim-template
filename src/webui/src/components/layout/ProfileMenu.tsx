import React from 'react';
import { User, Settings, LogOut } from 'lucide-react';

interface ProfileMenuProps {
  darkMode: boolean;
}

export function ProfileMenu({ darkMode }: ProfileMenuProps) {
  return (
    <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} z-50 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <button className={`w-full px-4 py-2 text-left flex items-center gap-2 border-b ${darkMode ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-gray-100 border-gray-200'}`}>
        <User size={16} /> Profile
      </button>
      <button className={`w-full px-4 py-2 text-left flex items-center gap-2 border-b ${darkMode ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-gray-100 border-gray-200'}`}>
        <Settings size={16} /> Settings
      </button>
      <button className={`w-full px-4 py-2 text-left flex items-center gap-2 text-red-600 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
        <LogOut size={16} /> Logout
      </button>
    </div>
  );
}
