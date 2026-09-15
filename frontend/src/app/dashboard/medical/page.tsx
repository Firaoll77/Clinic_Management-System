'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  User, 
  Calendar, 
  Heart, 
  Activity,
  Search,
  ChevronRight,
  Plus,
  Filter
} from 'lucide-react';

interface Encounter {
  id: string;
  chiefComplaint?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  icd10Code?: string;
  visitStatus: string;
  createdAt: string;
  patient: {
    id: string;
    mrn: string;
    firstName: string;
    lastName: string;
    dob: string;
    gender: string;
    bloodGroup?: string;
  };
  vitals?: Array<{
    temperatureC?: number;
    systolic?: number;
    diastolic?: number;
    pulse?: number;
    spo2?: number;
  }>;
  labOrders?: Array<{
    results: Array<{
      value: string;
      labTest: {
        name: string;
        referenceRange?: string;
      };
    }>;
  }>;
}

export default function MedicalRecordsPage() {
  const router = useRouter();
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  useEffect(() => {
    fetchEncounters();
  }, []);

  const fetchEncounters = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<{ encounters: Encounter[] }>('/medical/encounters/recent');
      if (response.data && response.data.encounters) {
        setEncounters(response.data.encounters);
      }
    } catch (error) {
      console.error('Failed to fetch encounters:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientEncounters = async (patientId: string) => {
    setLoading(true);
    try {
      const response = await apiClient.get<{ encounters: Encounter[] }>(`/medical/patients/${patientId}/encounters`);
      if (response.data && response.data.encounters) {
        setEncounters(response.data.encounters);
        setSelectedPatient(patientId);
      }
    } catch (error) {
      console.error('Failed to fetch patient encounters:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEncounters = encounters.filter(encounter => {
    const searchLower = searchQuery.toLowerCase();
    return (
      encounter.patient.firstName.toLowerCase().includes(searchLower) ||
      encounter.patient.lastName.toLowerCase().includes(searchLower) ||
      encounter.patient.mrn.toLowerCase().includes(searchLower) ||
      (encounter.chiefComplaint && encounter.chiefComplaint.toLowerCase().includes(searchLower))
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Medical Records</h2>
          <p className="text-gray-600 mt-1">View and manage patient medical records</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/patients')}
          className="px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Select Patient</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name, MRN, chief complaint..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-gray-900"
            />
            {selectedPatient && (
              <button
                onClick={() => {
                  setSelectedPatient(null);
                  fetchEncounters();
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Show All</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Medical Records List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      ) : encounters.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="p-6 text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No medical records found</h3>
            <p className="text-gray-600 mb-4">Select a patient to view their medical records</p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          {filteredEncounters.map((encounter, index) => (
            <motion.div
              key={encounter.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-3 rounded-lg">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {encounter.patient.firstName} {encounter.patient.lastName}
                        </h3>
                        <span className="text-sm text-gray-500">
                          ({encounter.patient.mrn})
                        </span>
                        {encounter.patient.bloodGroup && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                            {encounter.patient.bloodGroup}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(encounter.createdAt).toLocaleString()}</span>
                        </div>
                        {encounter.chiefComplaint && (
                          <div className="flex items-center space-x-2">
                            <Activity className="h-4 w-4" />
                            <span className="font-medium">Chief Complaint:</span>
                            <span>{encounter.chiefComplaint}</span>
                          </div>
                        )}
                        {encounter.icd10Code && (
                          <div className="flex items-center space-x-2">
                            <Heart className="h-4 w-4" />
                            <span className="font-medium">ICD-10:</span>
                            <span className="font-mono">{encounter.icd10Code}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => fetchPatientEncounters(encounter.patient.id)}
                      className="px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-xs font-medium border border-teal-200 transition-colors"
                    >
                      View History
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/patients/${encounter.patient.id}`)}
                      className="text-teal-600 hover:text-teal-900 transition-colors"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Vitals Preview */}
                {encounter.vitals && encounter.vitals.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2 mb-2">
                      <Heart className="h-4 w-4 text-rose-500" />
                      <span className="text-xs font-semibold text-gray-700">Recent Vitals</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      {encounter.vitals[0].temperatureC && (
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="text-gray-500 block">Temp</span>
                          <span className="font-medium">{encounter.vitals[0].temperatureC}°C</span>
                        </div>
                      )}
                      {encounter.vitals[0].systolic && encounter.vitals[0].diastolic && (
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="text-gray-500 block">BP</span>
                          <span className="font-medium">{encounter.vitals[0].systolic}/{encounter.vitals[0].diastolic}</span>
                        </div>
                      )}
                      {encounter.vitals[0].pulse && (
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="text-gray-500 block">Pulse</span>
                          <span className="font-medium">{encounter.vitals[0].pulse} bpm</span>
                        </div>
                      )}
                      {encounter.vitals[0].spo2 && (
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="text-gray-500 block">SpO2</span>
                          <span className="font-medium">{encounter.vitals[0].spo2}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Lab Results Preview */}
                {encounter.labOrders && encounter.labOrders.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2 mb-2">
                      <Activity className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-semibold text-gray-700">Lab Results</span>
                    </div>
                    <div className="space-y-1">
                      {encounter.labOrders.slice(0, 2).map((order, orderIdx) => (
                        <div key={orderIdx} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                          <span className="text-gray-600">
                            {order.results.length > 0 ? order.results[0].labTest.name : 'Pending'}
                          </span>
                          {order.results.length > 0 && (
                            <span className="font-medium text-gray-900">
                              {order.results[0].value}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}