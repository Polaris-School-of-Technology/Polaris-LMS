import React from 'react';
import { UserPlus, BookOpen, Upload, Plus } from 'lucide-react';

interface QuickActionsProps {
  onInviteMentor: () => void;
  onCreateProgram: () => void;
  onBulkUpload: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onInviteMentor,
  onCreateProgram,
  onBulkUpload
}) => {
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`${action.color} p-8 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl text-left group relative overflow-hidden`}
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
                <div className={`w-3 h-3 rounded-full ${
                  action.bgColor === '#ffc540' ? 'bg-black/20' : 'bg-[#ffc540]/50'
                } group-hover:scale-125 transition-transform duration-300`} />
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
        ))}
      </div>
    </div>
  );
};

export default QuickActions;