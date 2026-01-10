import React from 'react';
import { Search, Bell, User, ChevronDown } from 'lucide-react';

interface TopNavbarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ activeSection, setActiveSection }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Programs' },
    { id: 'mentors', label: 'Mentors' },
    { id: 'students', label: 'Students' },
    { id: 'reports', label: 'Reports' },
  ];

  return (
    <header className="bg-black border-b border-gray-800">
      <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-8 flex-1 min-w-0">
            {/* Logo */}
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-base sm:text-lg">P</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-white font-bold text-base sm:text-lg">Polarislabs</span>
                <span className="text-[#FFC540] text-xs sm:text-sm ml-1">2.0</span>
              </div>
            </div>
            
            {/* Navigation - Hidden on mobile */}
            <nav className="hidden md:flex space-x-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    activeSection === item.id || (activeSection === 'programs' && item.id === 'dashboard')
                      ? 'bg-[#FFC540] text-black'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-shrink-0">
            {/* Search - Hidden on mobile */}
            <div className="hidden lg:block relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC540] focus:border-transparent text-white placeholder-gray-400 w-48 xl:w-64 text-sm"
              />
            </div>
            
            {/* Notifications */}
            <button className="relative p-1.5 sm:p-2 text-gray-400 hover:text-white transition-colors duration-200">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-4 w-4 sm:h-5 sm:w-5 bg-[#FFC540] text-black text-[10px] sm:text-xs rounded-full flex items-center justify-center font-medium">
                3
              </span>
            </button>
            
            {/* User Profile - Simplified on mobile */}
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <div className="hidden md:flex items-center space-x-1">
                <span className="text-white font-medium text-sm">Admin</span>
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;