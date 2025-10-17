import React, { useState } from 'react';
import { Search, Bell, Sun, Moon } from 'lucide-react';
import { ProfileMenu } from './ProfileMenu';

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export function Header({ darkMode, toggleDarkMode }: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} px-6 py-4 flex items-center justify-between shadow-sm`}>
      {/* Search Bar */}
      <div className={`flex items-center gap-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} px-4 py-2 rounded-lg flex-1 max-w-md`}>
        <Search size={18} className="text-gray-500" />
        <input
          type="text"
          placeholder="Search..."
          className={`bg-transparent border-none outline-none flex-1 text-sm ${darkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}`}
        />
        <span className="text-xs text-gray-500">Ctrl + /</span>
      </div>

      {/* Right Side Controls */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Language Selector */}
        <button className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
          🌐
        </button>

        {/* Notifications */}
        <button className={`p-2 rounded-lg relative ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold"
          >
            BA
          </button>
          {showProfileMenu && <ProfileMenu darkMode={darkMode} />}
        </div>
      </div>
    </div>
  );
}
