import React, { useState, useEffect } from 'react';
import { AlertTriangle, UserX, VideoOff, Bell, X, Eye, Settings, AlertCircle, Loader2 } from 'lucide-react';
import { useApi } from '../services/api';

interface Alert {
  id: string;
  type: 'low-attendance' | 'mentor-inactivity' | 'missing-recordings' | 'system-issue' | 'upcoming-deadline';
  title: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  timestamp: string;
  read: boolean;
  data?: any;
}

const AlertsPanel: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high' | 'medium' | 'low'>('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const api = useApi();

  // Fetch alerts from backend
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.ums.alerts.getAll();
        setAlerts(response.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load alerts');

        // Fallback to some default alerts if API fails
        setAlerts([
          {
            id: 'fallback-1',
            type: 'system-issue',
            title: 'Alert System Status',
            message: 'Alert system is running normally',
            severity: 'low',
            timestamp: new Date().toISOString(),
            read: false,
            data: { status: 'operational' }
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [api.ums.alerts]);

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'low-attendance':
        return AlertCircle;
      case 'mentor-inactivity':
        return UserX;
      case 'missing-recordings':
        return VideoOff;
      case 'system-issue':
        return AlertTriangle;
      case 'upcoming-deadline':
        return Bell;
      default:
        return Bell;
    }
  };

  const getAlertColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const getCardBackground = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500/10 border-red-500/20';
      case 'medium':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'low':
        return 'bg-blue-500/10 border-blue-500/20';
      default:
        return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread') return !alert.read;
    if (filter === 'high' || filter === 'medium' || filter === 'low') return alert.severity === filter;
    return true;
  });

  const markAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, read: true } : alert
    ));
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    if (selectedAlert?.id === alertId) {
      setSelectedAlert(null);
    }
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
  };

  const getAlertStats = () => {
    const unreadCount = alerts.filter(alert => !alert.read).length;
    const highSeverityCount = alerts.filter(alert => alert.severity === 'high').length;
    const mediumSeverityCount = alerts.filter(alert => alert.severity === 'medium').length;
    const lowSeverityCount = alerts.filter(alert => alert.severity === 'low').length;

    return { unreadCount, highSeverityCount, mediumSeverityCount, lowSeverityCount };
  };

  const stats = getAlertStats();

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
            <span className="text-gray-300">Loading alerts...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <div>
              <h3 className="text-lg font-semibold text-red-400">Error Loading Alerts</h3>
              <p className="text-gray-300">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">System Alerts</h2>
          <p className="text-gray-400">Monitor and manage system alerts and notifications</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Mark All Read
          </button>
          <button className="p-2 text-gray-400 hover:text-yellow-500 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Alerts */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 hover:border-gray-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 group cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors duration-300">
              <Bell className="w-6 h-6 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1 group-hover:text-blue-300 transition-colors duration-300">
            {alerts.length}
          </div>
          <div className="text-gray-400 text-sm font-medium">Total Alerts</div>
        </div>

        {/* Unread Alerts */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 hover:border-gray-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10 group cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors duration-300">
              <AlertTriangle className="w-6 h-6 text-yellow-400 group-hover:text-yellow-300 transition-colors duration-300" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1 group-hover:text-yellow-300 transition-colors duration-300">
            {stats.unreadCount}
          </div>
          <div className="text-gray-400 text-sm font-medium">Unread</div>
        </div>

        {/* High Priority */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 hover:border-gray-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10 group cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-red-500/10 group-hover:bg-red-500/20 transition-colors duration-300">
              <AlertCircle className="w-6 h-6 text-red-400 group-hover:text-red-300 transition-colors duration-300" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1 group-hover:text-red-300 transition-colors duration-300">
            {stats.highSeverityCount}
          </div>
          <div className="text-gray-400 text-sm font-medium">High Priority</div>
        </div>

        {/* Medium/Low Priority */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 hover:border-gray-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10 group cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors duration-300">
              <Bell className="w-6 h-6 text-green-400 group-hover:text-green-300 transition-colors duration-300" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1 group-hover:text-green-300 transition-colors duration-300">
            {stats.mediumSeverityCount + stats.lowSeverityCount}
          </div>
          <div className="text-gray-400 text-sm font-medium">Medium/Low</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 p-2 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-x-auto">
        <div className="flex items-center space-x-2 min-w-max">
          {[
            { key: 'all', label: 'All', count: alerts.length },
            { key: 'unread', label: 'Unread', count: stats.unreadCount },
            { key: 'high', label: 'High', count: stats.highSeverityCount },
            { key: 'medium', label: 'Medium', count: stats.mediumSeverityCount },
            { key: 'low', label: 'Low', count: stats.lowSeverityCount }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-3 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 whitespace-nowrap ${
                filter === tab.key
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/25'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/50 hover:shadow-md'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold transition-colors duration-300 ${
                  filter === tab.key ? 'bg-black/20 text-black' : 'bg-gray-700/50 text-gray-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-800/50">
              <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No Alerts Found</h3>
              <p className="text-gray-400">No alerts match your current filter criteria.</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const AlertIcon = getAlertIcon(alert.type);
              return (
                <div
                  key={alert.id}
                  className={`bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg group cursor-pointer ${
                    alert.read
                      ? 'border-gray-800/50 hover:border-gray-700/50'
                      : `border-l-4 border-l-yellow-500 ${getCardBackground(alert.severity)} hover:shadow-yellow-500/10`
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-xl bg-gray-800/50 group-hover:bg-gray-700/50 transition-colors duration-300`}>
                        <AlertIcon className={`w-6 h-6 ${getAlertColor(alert.severity)} group-hover:scale-110 transition-transform duration-300`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className={`text-lg font-bold ${alert.read ? 'text-gray-300' : 'text-white'} group-hover:text-white transition-colors duration-300`}>
                            {alert.title}
                          </h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            alert.severity === 'high' ? 'bg-red-500 text-white' :
                            alert.severity === 'medium' ? 'bg-yellow-500 text-black' :
                            'bg-blue-500 text-white'
                          }`}>
                            {alert.severity.toUpperCase()}
                          </span>
                          {!alert.read && (
                            <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse"></span>
                          )}
                        </div>
                        <p className={`mb-3 text-base leading-relaxed ${alert.read ? 'text-gray-400' : 'text-gray-300'} group-hover:text-gray-200 transition-colors duration-300`}>
                          {alert.message}
                        </p>
                        <div className="text-sm text-gray-500 font-medium">
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          setSelectedAlert(alert);
                          markAsRead(alert.id);
                        }}
                        className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-xl transition-all duration-300"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all duration-300"
                        title="Dismiss"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
          <div className="flex items-center justify-center min-h-screen px-6">
            <div className="modal-backdrop" onClick={() => setSelectedAlert(null)} />
            <div className="modal-content relative w-full max-w-lg">
              <div className="px-8 py-6 border-b border-gray-800/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Alert Details</h3>
                  <button
                    onClick={() => setSelectedAlert(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="px-8 py-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider ${
                      selectedAlert.severity === 'high' ? 'bg-red-500 text-white' :
                      selectedAlert.severity === 'medium' ? 'bg-yellow-500 text-black' :
                      'bg-blue-500 text-white'
                    }`}>
                      {selectedAlert.severity.toUpperCase()}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {new Date(selectedAlert.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <h4 className="text-lg font-semibold text-white">{selectedAlert.title}</h4>
                  <p className="text-gray-300">{selectedAlert.message}</p>

                  {selectedAlert.data && (
                    <div className="bg-gray-800 rounded-lg p-4 mt-4">
                      <h5 className="text-sm font-semibold text-gray-300 mb-3">Additional Details:</h5>
                      <div className="space-y-1 text-sm">
                        {Object.entries(selectedAlert.data).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-400 capitalize font-medium">{key.replace(/([A-Z])/g, ' $1')}:</span>
                            <span className="text-white font-semibold">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setSelectedAlert(null)}
                    className="px-6 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-colors font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      dismissAlert(selectedAlert.id);
                      setSelectedAlert(null);
                    }}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                  >
                    Dismiss Alert
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;