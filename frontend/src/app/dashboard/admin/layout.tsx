'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { 
  LogOut, 
  HeartPulse,
  User,
  Settings,
  Users,
  Activity,
  Calendar,
  Shield,
  DollarSign
} from 'lucide-react';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading, logout, user } = useAuth();
  const { activeTab, setActiveTab } = useNavigation();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
    if (!loading && isAuthenticated && user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router, user?.role]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-medical">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D93344] mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex flex-col">
      {/* Header */}
      <header className="bg-[#D93344] shadow-lg sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-white p-2 rounded-lg">
                  <HeartPulse className="h-6 w-6 text-[#D93344]" />
                </div>
                <h1 className="text-xl font-bold text-white">
                  Clinic Admin Command Center
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <User className="h-5 w-5 text-white" />
                <span className="text-sm text-white font-medium">
                  {user?.staffProfile?.fullName || user?.email}
                </span>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Menu */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'overview'
                  ? 'bg-red-100 text-red-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Activity className="h-5 w-5" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'staff'
                  ? 'bg-red-100 text-red-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="h-5 w-5" />
              <span>Staff Management</span>
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'appointments'
                  ? 'bg-red-100 text-red-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span>Appointments</span>
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'billing'
                  ? 'bg-red-100 text-red-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <DollarSign className="h-5 w-5" />
              <span>Billing</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'settings'
                  ? 'bg-red-100 text-red-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Shield className="h-5 w-5" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Bento-Box Analytics */}
      <div className="flex-1 overflow-auto p-6">
        {children}
      </div>
    </div>
  );
}