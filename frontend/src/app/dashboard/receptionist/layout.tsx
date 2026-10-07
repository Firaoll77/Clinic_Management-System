'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LogOut,
  HeartPulse,
  User,
  Clock,
  ChevronRight,
  Users,
  UserPlus,
  Calendar,
  Receipt,
  Database,
  Menu,
  Bell,
  Search,
  LayoutDashboard
} from 'lucide-react';

export default function ReceptionistDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout, user } = useAuth();
  const { activeTab, setActiveTab, role, setRole } = useNavigation();
  const { currentStep, setCurrentStep, setWorkflowSteps } = useWorkflow();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Set role on mount
  useEffect(() => {
    setRole('receptionist');
  }, [setRole]);

  // Initialize workflow steps for receptionist (for navigation tracking only)
  useEffect(() => {
    setWorkflowSteps(['queue', 'registration', 'billing', 'patients']);
  }, [setWorkflowSteps]);

  // Role verification - redirect if wrong role
  useEffect(() => {
    if (user && user.role !== 'RECEPTIONIST') {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (!user || user.role !== 'RECEPTIONIST') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7f9]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D93344] mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  const navigationGroups = [
    {
      label: 'OPERATIONS',
      items: [
        { id: 'queue' as const, label: 'Patient Queue', icon: Users },
        { id: 'registration' as const, label: 'Registration', icon: UserPlus },
      ]
    },
    {
      label: 'MANAGEMENT',
      items: [
        { id: 'patients' as const, label: 'Patients List', icon: Database },
        { id: 'billing' as const, label: 'Billing', icon: Receipt }
      ]
    }
  ];

  const getBreadcrumb = () => {
    const labels: Record<string, string> = {
      queue: 'Patient Queue',
      registration: 'Registration',
      patients: 'Patients List',
      billing: 'Billing',
    };
    return `Home › Reception › ${labels[currentStep] || 'Queue'}`;
  };

  return (
    <div className="min-h-screen bg-[#f5f7f9] flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1f2933] border-r border-gray-700/50 flex-shrink-0 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="p-5 border-b border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="bg-[#D93344] p-2.5 rounded-lg">
              <HeartPulse className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">Clinic Management</h1>
              <p className="text-xs text-gray-400">Reception Desk</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          {navigationGroups.map((group) => (
            <div key={group.label} className="mb-6">
              <h3 className="px-5 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {group.label}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isCurrent = currentStep === item.id;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentStep(item.id)}
                      className={`w-full flex items-center space-x-3 px-5 py-2.5 text-sm transition-all duration-200 relative ${
                        isCurrent
                          ? 'text-white bg-[#2d3748] border-l-4 border-[#D93344]'
                          : 'text-gray-400 hover:text-white hover:bg-[#2d3748]/50'
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium">{item.label}</span>
                      {isCurrent && (
                        <ChevronRight className="h-4 w-4 ml-auto text-[#D93344]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-gray-700/50 space-y-3">
          <div className="flex items-center space-x-3 px-3 py-2.5 bg-[#2d3748]/50 rounded-lg">
            <div className="h-8 w-8 rounded-full bg-[#D93344] flex items-center justify-center text-white text-xs font-bold">
              {user?.staffProfile?.fullName
                ? user.staffProfile.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                : (user?.email ? user.email[0].toUpperCase() : 'R')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.staffProfile?.fullName || user?.email}
              </p>
              <p className="text-xs text-gray-400 truncate">Receptionist</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#D93344] hover:bg-[#b92b3a] text-white rounded-lg transition-all duration-200 text-sm font-medium"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between px-6 py-3">
            {/* Left: Toggle & Breadcrumb */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                aria-label="Toggle sidebar"
                aria-expanded={sidebarOpen}
              >
                <Menu className="h-5 w-5" />
              </button>
              <nav className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                <span className="text-gray-400">Home</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="text-gray-400">Reception</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-900">
                  {currentStep === 'queue' ? 'Patient Queue' :
                   currentStep === 'registration' ? 'Registration' :
                   currentStep === 'patients' ? 'Patients List' :
                   currentStep === 'billing' ? 'Billing' : 'Queue'}
                </span>
              </nav>
            </div>

            {/* Center: Search (decorative) */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D93344]/20 focus:border-[#D93344]"
                  disabled
                />
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-2">
              <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-[#D93344] rounded-full"></span>
              </button>
              <div className="h-6 w-px bg-gray-200 mx-2" />
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-[#D93344] flex items-center justify-center text-white text-xs font-bold">
                  {user?.staffProfile?.fullName
                    ? user.staffProfile.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                    : (user?.email ? user.email[0].toUpperCase() : 'R')}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Canvas */}
        <main className="flex-1 overflow-auto">
          <div className="px-6 py-6 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 flex-shrink-0">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <p>© {new Date().getFullYear()} Clinic Management System. All rights reserved.</p>
              <p>Version 1.0.0</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}