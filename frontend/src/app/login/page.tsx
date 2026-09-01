'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  Mail, 
  HeartPulse, 
  AlertCircle,
  ArrowRight,
  User
} from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const quickFillCredentials = (role: string) => {
    const credentials: Record<string, { username: string; password: string }> = {
      admin: { username: 'admin', password: 'Admin@123' },
      doctor: { username: 'doctor', password: 'Doctor@123' },
      receptionist: { username: 'receptionist', password: 'Reception@123' },
      nurse: { username: 'nurse', password: 'Nurse@123' },
      lab: { username: 'labtech', password: 'Lab@123' },
    };

    if (credentials[role]) {
      setUsername(credentials[role].username);
      setPassword(credentials[role].password);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo and Branding */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center bg-gradient-to-br from-teal-400 to-teal-600 p-4 rounded-2xl mb-4 shadow-lg">
            <HeartPulse className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Clinic Management System</h1>
          <p className="text-gray-600">Sign in to access your dashboard</p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center"
              >
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="space-y-2"
              >
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  Username
                </label>
                <div className="relative">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-gray-900 pl-10"
                    placeholder="Enter your username"
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="space-y-2"
              >
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Lock className="h-4 w-4 mr-2 text-gray-400" />
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-gray-900 pl-10"
                    placeholder="Enter your password"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Test Credentials Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="pt-6 border-t border-gray-200"
            >
              <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <User className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-3">Test Credentials</p>
                    <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Admin:</span>
                        <button 
                          onClick={() => quickFillCredentials('admin')}
                          className="text-teal-600 hover:text-teal-700 hover:underline"
                        >
                          admin / Admin@123
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Doctor:</span>
                        <button 
                          onClick={() => quickFillCredentials('doctor')}
                          className="text-teal-600 hover:text-teal-700 hover:underline"
                        >
                          doctor / Doctor@123
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Receptionist:</span>
                        <button 
                          onClick={() => quickFillCredentials('receptionist')}
                          className="text-teal-600 hover:text-teal-700 hover:underline"
                        >
                          receptionist / Reception@123
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Nurse:</span>
                        <button 
                          onClick={() => quickFillCredentials('nurse')}
                          className="text-teal-600 hover:text-teal-700 hover:underline"
                        >
                          nurse / Nurse@123
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Lab Tech:</span>
                        <button 
                          onClick={() => quickFillCredentials('lab')}
                          className="text-teal-600 hover:text-teal-700 hover:underline"
                        >
                          labtech / Lab@123
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-center text-sm text-gray-600 mt-6"
        >
          © 2024 Clinic Management System. All rights reserved.
        </motion.p>
      </motion.div>
    </div>
  );
}