'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Droplet, 
  Shield,
  ArrowLeft,
  Save,
  X
} from 'lucide-react';

export default function RegisterPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: 'MALE',
    phone: '',
    email: '',
    nationalId: '',
    address: '',
    bloodGroup: '',
    emergencyContact: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Frontend validation for national ID
    if (formData.nationalId && formData.nationalId.length < 5) {
      setError('National ID must be at least 5 characters');
      setLoading(false);
      return;
    }

    const response = await apiClient.post('/patients/register', formData);

    if (response.error) {
      setError(response.error);
      setLoading(false);
    } else {
      router.push('/dashboard/patients');
    }
  };

  const formSections = [
    {
      title: 'Personal Information',
      icon: User,
      fields: [
        { name: 'firstName', label: 'First Name', type: 'text', required: true, icon: User },
        { name: 'lastName', label: 'Last Name', type: 'text', required: true, icon: User },
        { name: 'dob', label: 'Date of Birth', type: 'date', required: true, icon: Calendar },
        { name: 'gender', label: 'Gender', type: 'select', required: true, options: ['MALE', 'FEMALE'], icon: User },
      ]
    },
    {
      title: 'Contact Information',
      icon: Phone,
      fields: [
        { name: 'phone', label: 'Phone Number', type: 'tel', required: true, icon: Phone },
        { name: 'email', label: 'Email Address', type: 'email', required: false, icon: Mail },
        { name: 'nationalId', label: 'National ID', type: 'text', required: true, icon: Shield },
        { name: 'address', label: 'Address', type: 'text', required: false, icon: MapPin },
      ]
    },
    {
      title: 'Medical Information',
      icon: Droplet,
      fields: [
        { name: 'bloodGroup', label: 'Blood Group', type: 'select', required: false, 
          options: 
          ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], 
          icon: Droplet 
        },
        { name: 'emergencyContact', label: 'Emergency Contact', type: 'text', required: false, icon: Shield },
      ]
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Register New Patient</h2>
          <p className="text-gray-600 mt-1">Fill in the patient's information below</p>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center"
        >
          <X className="h-5 w-5 mr-2" />
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {formSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: sectionIndex * 0.1 }}
            className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-blue-50">
              <div className="flex items-center space-x-3">
                <div className="bg-teal-100 p-2 rounded-lg">
                  <section.icon className="h-5 w-5 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {section.fields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <field.icon className="h-4 w-4 mr-2 text-gray-400" />
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        name={field.name}
                        required={field.required}
                        value={formData[field.name as keyof typeof formData]}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-gray-900"
                      >
                        {field.options?.map((option) => (
                          <option key={option} value={option}>
                            {option || 'Select'}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        name={field.name}
                        required={field.required}
                        value={formData[field.name as keyof typeof formData]}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-gray-900"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-end gap-4"
        >
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2"
          >
            <X className="h-5 w-5" />
            <span>Cancel</span>
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
          >
            <Save className="h-5 w-5" />
            <span>{loading ? 'Registering...' : 'Register Patient'}</span>
          </button>
        </motion.div>
      </form>
    </motion.div>
  );
}