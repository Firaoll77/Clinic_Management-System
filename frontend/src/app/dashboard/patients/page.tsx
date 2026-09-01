'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Plus, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  Filter,
  ChevronRight,
  Archive,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  X,
  Layers
} from 'lucide-react';

interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  dob: string;
  gender: string;
  isArchived?: boolean;
  archivedAt?: string;
}

export default function PatientsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [counts, setCounts] = useState({ total: 0, active: 0, archived: 0 });

  // Archival modal state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery.trim()) queryParams.set('search', searchQuery.trim());
      queryParams.set('status', statusFilter);

      const response = await apiClient.get<{
        patients: Patient[];
        total: number;
        totalAll: number;
        activeCount: number;
        archivedCount: number;
      }>(`/patients?${queryParams.toString()}`);

      if (response.data) {
        setPatients(response.data.patients || []);
        setCounts({
          total: response.data.totalAll || 0,
          active: response.data.activeCount || 0,
          archived: response.data.archivedCount || 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch patients', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleSearch = () => {
    fetchPatients();
  };

  const handleArchiveConfirm = async () => {
    if (!selectedPatient) return;
    setActionLoading(true);
    try {
      const response = await apiClient.post(`/patients/${selectedPatient.id}/archive`, {});
      if (response.error) {
        showToast(response.error, 'error');
        return;
      }

      showToast(`Patient ${selectedPatient.firstName} ${selectedPatient.lastName} archived.`);
      setIsArchiveModalOpen(false);
      setSelectedPatient(null);
      fetchPatients();
    } catch (err) {
      showToast('Failed to archive patient.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreConfirm = async () => {
    if (!selectedPatient) return;
    setActionLoading(true);
    try {
      const response = await apiClient.post(`/patients/${selectedPatient.id}/restore`, {});
      if (response.error) {
        showToast(response.error, 'error');
        return;
      }

      showToast(`Patient ${selectedPatient.firstName} ${selectedPatient.lastName} restored to active list.`);
      setIsRestoreModalOpen(false);
      setSelectedPatient(null);
      fetchPatients();
    } catch (err) {
      showToast('Failed to restore patient.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-xl shadow-lg border flex items-center justify-between z-50 ${
              toast.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-red-50 text-red-900 border-red-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              {toast.type === 'success' ? <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />}
              <span className="font-medium text-sm">{toast.message}</span>
            </div>
            <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Patient Directory</h2>
          <p className="text-gray-500 text-sm mt-1">Manage active patient records and archived charts</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/patients/register')}
          className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold rounded-xl shadow-md transition-all flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tab Pills */}
        <div className="flex items-center bg-gray-100 rounded-xl p-1 text-xs font-semibold text-gray-700 w-full md:w-auto">
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-1.5 ${
              statusFilter === 'active' ? 'bg-white shadow text-teal-800' : 'hover:text-gray-900'
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5 text-teal-600" />
            <span>Active Patients ({counts.active})</span>
          </button>
          <button
            onClick={() => setStatusFilter('archived')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-1.5 ${
              statusFilter === 'archived' ? 'bg-white shadow text-amber-800' : 'hover:text-gray-900'
            }`}
          >
            <Archive className="h-3.5 w-3.5 text-amber-600" />
            <span>Archived ({counts.archived})</span>
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-1.5 ${
              statusFilter === 'all' ? 'bg-white shadow text-purple-800' : 'hover:text-gray-900'
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-purple-600" />
            <span>All Records ({counts.total})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 w-full md:max-w-md flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, MRN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm text-gray-900"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
              }}
              className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Patients Table */}
      {loading ? (
        <div className="flex justify-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
        </div>
      ) : patients.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center"
        >
          <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-teal-100">
            <User className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No patients found</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            {searchQuery
              ? `No records found matching "${searchQuery}". Try a different search term.`
              : statusFilter === 'archived'
              ? 'There are currently no archived patient records.'
              : 'Get started by registering your first clinic patient.'}
          </p>
          <div className="flex justify-center space-x-3">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                Clear Search
              </button>
            )}
            <button
              onClick={() => router.push('/dashboard/patients/register')}
              className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors inline-flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Register Patient</span>
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    MRN
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Age / Gender
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 text-sm">
                {patients.map((patient, index) => (
                  <tr key={patient.id} className="hover:bg-teal-50/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm ${
                          patient.isArchived ? 'bg-gray-500' : 'bg-gradient-to-br from-teal-500 to-teal-700'
                        }`}>
                          {patient.firstName[0]}{patient.lastName[0]}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">
                            {patient.firstName} {patient.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {patient.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-800 rounded-lg">
                        {patient.mrn}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-xs text-gray-900">
                        <Phone className="h-3.5 w-3.5 mr-1 text-gray-400" />
                        {patient.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-900 font-medium">{patient.gender}</div>
                      <div className="text-xs text-gray-500">
                        {patient.dob ? `${new Date().getFullYear() - new Date(patient.dob).getFullYear()} yrs` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {patient.isArchived ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <Archive className="w-3 h-3 mr-1" />
                          Archived
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {isAdmin && (
                          patient.isArchived ? (
                            <button
                              onClick={() => {
                                setSelectedPatient(patient);
                                setIsRestoreModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1"
                            >
                              <RotateCcw className="h-3 w-3" />
                              <span>Restore</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedPatient(patient);
                                setIsArchiveModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1"
                            >
                              <Archive className="h-3 w-3" />
                              <span>Archive</span>
                            </button>
                          )
                        )}
                        <button
                          onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
                          className="px-3 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-xs font-semibold transition-colors inline-flex items-center"
                        >
                          <span>View Record</span>
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Archive Modal */}
      <AnimatePresence>
        {isArchiveModalOpen && selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md p-6"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                <Archive className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Archive Patient Record
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to archive the record for <strong className="text-gray-900">{selectedPatient.firstName} {selectedPatient.lastName}</strong> ({selectedPatient.mrn})?
              </p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsArchiveModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleArchiveConfirm}
                  disabled={actionLoading}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm shadow-md transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Archiving...' : 'Archive Patient'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Restore Modal */}
      <AnimatePresence>
        {isRestoreModalOpen && selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md p-6"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <RotateCcw className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Restore Patient Record
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Restore <strong className="text-gray-900">{selectedPatient.firstName} {selectedPatient.lastName}</strong> ({selectedPatient.mrn}) to the active patient roster?
              </p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsRestoreModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRestoreConfirm}
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Restoring...' : 'Restore to Active'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}