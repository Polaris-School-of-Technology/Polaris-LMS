import React, { useState } from 'react';
import { Bell, User, ChevronDown, Settings, LogOut, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  notifications: number;
  onNotificationClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ notifications, onNotificationClick }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Programs', active: true },
    { name: 'Mentors', active: false },
    { name: 'Students', active: false },
    { name: 'Reports', active: false },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-gray-800/50 px-6 py-4">
      <div className="flex items-center justify-between max-w-8xl mx-auto">
        {/* Logo and Nav Items */}
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(to bottom right, #ffc540, #e6b036)' }}>
              <span className="text-black font-bold text-xl">P</span>
            </div>
            <div>
              <span className="text-white font-bold text-xl">Plarislabs</span>
              <span className="font-semibold text-sm ml-1" style={{ color: '#ffc540' }}>2.0</span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <button
                key={item.name}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  item.active
                    ? 'text-black bg-yellow-500 shadow-lg shadow-yellow-500/25'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="hidden lg:flex relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search..."
              className="input-field pl-12 pr-4 py-3 w-72 placeholder-gray-500"
            />
          </div>

          {/* Notifications */}
          <button
            onClick={onNotificationClick}
            className="relative p-3 text-gray-400 transition-all duration-200 hover:bg-gray-800/50 rounded-xl"
            style={{ '--hover-color': '#ffc540' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffc540'}
            onMouseLeave={(e) => e.currentTarget.style.color = ''}
          >
            <Bell className="w-6 h-6" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg">
                {notifications > 9 ? '9+' : notifications}
              </span>
            )}
          </button>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-3 p-3 text-gray-400 hover:text-white transition-all duration-200 hover:bg-gray-800/50 rounded-xl"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center border border-gray-600">
                <User className="w-5 h-5" />
              </div>
              <span className="hidden md:block text-sm font-medium">{user?.name || 'User'}</span>
              <ChevronDown className="w-5 h-5" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 py-2 animate-slide-up">
                <button className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 w-full transition-all duration-200">
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={logout}
                  className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 w-full transition-all duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;