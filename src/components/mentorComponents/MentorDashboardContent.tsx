import React from 'react';
import MentorOverview from './MentorOverview';
import MentorStudents from './MentorStudents';
import MentorSchedule from './MentorSchedule';
import MentorSessions from './MentorSessions';
import MentorRecordings from './MentorRecordings';
import MentorAnalytics from './MentorAnalytics';

interface MentorDashboardContentProps {
  activeSection: string;
}

const MentorDashboardContent: React.FC<MentorDashboardContentProps> = ({ activeSection }) => {
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
      case 'overview':
      case 'students':
      case 'schedule':
      case 'recordings':
      case 'analytics':
        return <MentorOverview activeSection={activeSection} setActiveSection={() => { }} />;
      default:
        return <MentorOverview activeSection={activeSection} setActiveSection={() => { }} />;
    }
  };

  return (
    <div className="w-full">
      {renderContent()}
    </div>
  );
};

export default MentorDashboardContent;