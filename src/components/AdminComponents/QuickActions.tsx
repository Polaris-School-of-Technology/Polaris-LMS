import React, { useState } from 'react';
import { UserPlus, BookOpen, Upload, Plus, Info, X, Users } from 'lucide-react';

interface QuickActionsProps {
  onInviteMentor: () => void;
  onCreateProgram: () => void;
  onCreateGroup: ()=> void;
  onBulkUpload: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onInviteMentor,
  onCreateProgram,
  onCreateGroup,
  onBulkUpload
}) => {
  const [showCsvInfo, setShowCsvInfo] = useState(false);
  const actions = [
    {
      title: 'Invite Mentor',
      description: 'Send invitation to new mentor',
      icon: UserPlus,
      onClick: onInviteMentor,
      color: 'hover:opacity-90',
      bgColor: '#ffc540'
    },
    {
      title: 'Create Program',
      description: 'Set up a new learning program',
      icon: BookOpen,
      onClick: onCreateProgram,
      color: 'bg-gray-700 hover:bg-gray-600'
    },
    {
      title: 'Create Group',
      description: 'Set up a new learning group',
      icon: Users,
      onClick: onCreateGroup,
      color: 'bg-gray-700 hover:bg-gray-600'
    },
    {
      title: 'Bulk Upload Students',
      description: 'Upload student data from CSV',
      icon: Upload,
      onClick: onBulkUpload,
      color: 'bg-gray-700 hover:bg-gray-600'
    }
  ];

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Quick Actions</h2>
        <button className="btn-primary">
          <Plus className="w-4 h-4" />
          <span>More Actions</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {actions.map((action, index) => (
          <div key={index} className="relative">
            <button
              onClick={action.onClick}
              className={`${action.color} p-8 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl text-left group relative overflow-hidden w-full`}
              style={{ backgroundColor: action.bgColor || '#374151' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${
                    action.bgColor === '#ffc540' ? 'bg-black/10' : 'bg-[#ffc540]/10'
                  }`}>
                    <action.icon className={`w-7 h-7 ${
                  action.bgColor === '#ffc540' ? 'text-black' : 'text-[#ffc540]'
                }`} />
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Info button for Bulk Upload Students */}
                    {action.title === 'Bulk Upload Students' && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCsvInfo(!showCsvInfo);
                        }}
                        className={`p-1 rounded-full transition-colors cursor-pointer ${
                          action.bgColor === '#ffc540' 
                            ? 'text-black/60 hover:text-black hover:bg-black/10' 
                            : 'text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                        title="CSV Format Information"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowCsvInfo(!showCsvInfo);
                          }
                        }}
                      >
                        <Info className="w-4 h-4" />
                      </div>
                    )}
                    <div className={`w-3 h-3 rounded-full ${
                      action.bgColor === '#ffc540' ? 'bg-black/20' : 'bg-[#ffc540]/50'
                    } group-hover:scale-125 transition-transform duration-300`} />
                  </div>
                </div>
                <h3 className={`font-bold text-lg mb-2 ${
                  action.bgColor === '#ffc540' ? 'text-black' : 'text-white'
                }`}>
                  {action.title}
                </h3>
                <p className={`text-sm font-medium ${
                  action.bgColor === '#ffc540' ? 'text-black/70' : 'text-gray-300'
                }`}>
                  {action.description}
                </p>
              </div>
            </button>
            
            {/* CSV Format Tooltip for Bulk Upload Students */}
            {action.title === 'Bulk Upload Students' && showCsvInfo && (
              <div className="absolute top-0 right-0 z-20 bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-2xl max-w-sm">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-white font-semibold text-sm">CSV Format Required</h4>
                  <button
                    onClick={() => setShowCsvInfo(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-gray-300 space-y-3">
                  <p>• First row should contain headers: <code className="bg-gray-800 px-1 rounded">name, email, rollNumber</code></p>
                  <p>• Each subsequent row should contain student data</p>
                  <p>• Example CSV structure:</p>
                  
                  {/* CSV Grid Table */}
                  <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-700">
                          <th className="px-3 py-2 text-left font-semibold text-yellow-400 border-r border-gray-600">name</th>
                          <th className="px-3 py-2 text-left font-semibold text-yellow-400 border-r border-gray-600">email</th>
                          <th className="px-3 py-2 text-left font-semibold text-yellow-400">rollNumber</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-gray-600">
                          <td className="px-3 py-2 text-gray-200 border-r border-gray-600">John Doe</td>
                          <td className="px-3 py-2 text-gray-200 border-r border-gray-600">john.doe@example.com</td>
                          <td className="px-3 py-2 text-gray-200">STU001</td>
                        </tr>
                        <tr className="border-t border-gray-600">
                          <td className="px-3 py-2 text-gray-200 border-r border-gray-600">Jane Smith</td>
                          <td className="px-3 py-2 text-gray-200 border-r border-gray-600">jane.smith@example.com</td>
                          <td className="px-3 py-2 text-gray-200">STU002</td>
                        </tr>
                        <tr className="border-t border-gray-600">
                          <td className="px-3 py-2 text-gray-200 border-r border-gray-600">Mike Johnson</td>
                          <td className="px-3 py-2 text-gray-200 border-r border-gray-600">mike.johnson@example.com</td>
                          <td className="px-3 py-2 text-gray-200">STU003</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="text-xs text-gray-400 mt-2">
                    <p>💡 <strong>Tip:</strong> Save your CSV file with UTF-8 encoding for best compatibility</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;