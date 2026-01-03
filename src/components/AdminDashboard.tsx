import { useState } from 'react';
import { LogOut, List, Users, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PrayerRequestsList from './PrayerRequestsList';
import FellowshipManagement from './FellowshipManagement';

type TabType = 'pending' | 'completed' | 'fellowships';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-bold">JR</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Jesus Redeemer Prayer Army
                </h1>
                <p className="text-sm text-gray-600">Admin Dashboard</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <nav className="flex gap-2 mb-6 bg-white p-2 rounded-lg shadow-sm">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'pending'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-5 h-5" />
            Pending Requests
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'completed'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            Completed Requests
          </button>
          <button
            onClick={() => setActiveTab('fellowships')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'fellowships'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Users className="w-5 h-5" />
            Fellowship Management
          </button>
        </nav>

        <div className="bg-white rounded-lg shadow-sm">
          {activeTab === 'pending' && <PrayerRequestsList status="pending" />}
          {activeTab === 'completed' && <PrayerRequestsList status="completed" />}
          {activeTab === 'fellowships' && <FellowshipManagement />}
        </div>
      </div>
    </div>
  );
}
