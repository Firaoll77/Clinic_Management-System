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
  Calendar,
  Receipt,
  Phone
} from 'lucide-react';

export default function ReceptionistDashboardLayout({
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
    if (!loading && isAuthenticated && user?.role !== 'RECEPTIONIST') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router, user?.role]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-medical">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'RECEPTIONIST') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-white p-2 rounded-lg">
                  <HeartPulse className="h-6 w-6 text-green-600" />
                </div>
                <h1 className="text-xl font-bold text-white">
                  Reception Desk
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
              onClick={() => setActiveTab('queue')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'queue'
                  ? 'bg-green-100 text-green-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="h-5 w-5" />
              <span>Patient Queue</span>
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'appointments'
                  ? 'bg-green-100 text-green-700 font-medium'
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
                  ? 'bg-green-100 text-green-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Receipt className="h-5 w-5" />
              <span>Billing</span>
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'register'
                  ? 'bg-green-100 text-green-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Phone className="h-5 w-5" />
              <span>Register Patient</span>
            </button>
          </div>
        </div>
      </nav>

      {/* 50/50 Split-Screen Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {children}
      </div>
    </div>
  );
}