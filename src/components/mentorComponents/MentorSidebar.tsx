import React from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  BarChart3,
  Settings,
  LogOut
} from 'lucide-react';

interface MentorSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const MentorSidebar: React.FC<MentorSidebarProps> = ({ activeSection, setActiveSection }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Feedback', icon: Users },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'recordings', label: 'Recordings', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="w-64 bg-black text-white flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-yellow-400">Polaris Labs</h1>
        <p className="text-gray-400 text-sm mt-1">Mentor Portal</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${activeSection === item.id
                    ? 'bg-yellow-400 text-black'
                    : 'hover:bg-gray-800 text-gray-300 hover:text-white'
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button className="w-full flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200">
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </button>
        <button className="w-full flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 mt-2">
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default MentorSidebar;