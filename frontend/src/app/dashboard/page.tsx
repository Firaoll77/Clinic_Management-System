'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // Redirect to role-specific dashboard
    if (!loading && isAuthenticated && user?.role) {
      const roleRoutes: Record<string, string> = {
        'DOCTOR': '/dashboard/doctor',
        'RECEPTIONIST': '/dashboard/receptionist',
        'NURSE': '/dashboard/nurse',
        'LAB_TECH': '/dashboard/laboratorist',
        'ADMIN': '/dashboard/admin'
      };

      const targetRoute = roleRoutes[user.role];
      if (targetRoute) {
        router.replace(targetRoute);
      }
    }
  }, [isAuthenticated, loading, router, user?.role]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <div className="text-xl text-gray-600">Redirecting to your dashboard...</div>
      </div>
    </div>
  );
}