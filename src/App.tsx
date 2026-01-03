import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PrayerRequestForm from './components/PrayerRequestForm';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

function AppContent() {
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    const checkRoute = () => {
      setIsAdminRoute(window.location.hash === '#admin');
    };

    checkRoute();
    window.addEventListener('hashchange', checkRoute);
    return () => window.removeEventListener('hashchange', checkRoute);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (isAdminRoute) {
    if (user) {
      return <AdminDashboard />;
    }
    return <AdminLogin />;
  }

  return <PrayerRequestForm />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
