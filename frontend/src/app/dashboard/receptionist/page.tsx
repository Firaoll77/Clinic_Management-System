'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import {
  Search,
  UserPlus,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  X,
  ChevronRight,
  Plus,
  Stethoscope,
  Users,
  Receipt,
  DollarSign
} from 'lucide-react';

interface WaitingPatient {
  id: string;
  name: string;
  mrn: string;
  phone: string;
  visitStatus: string;
  createdAt: string;
  isNewPatient?: boolean;
  hasHistory?: boolean;
  encounterId?: string;
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  isAvailable: boolean;
  currentPatients: number;
  maxPatients: number;
}

interface Nurse {
  id: string;
  name: string;
  isAvailable: boolean;
  currentPatients: number;
  maxPatients: number;
}

interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  dob: string;
  gender: string;
  isNewPatient: boolean;
  lastVisit?: string;
}

interface NewPatient {
  firstName: string;
  lastName: string;
  dob: string;
  phone: string;
  email: string;
  address: string;
  gender: string;
  nationalId: string;
  bloodGroup: string;
  emergencyContact: string;
}

export default function ReceptionistDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'search' | 'register' | 'doctors' | 'billing'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<WaitingPatient | null>(null);
  const [waitingPatients, setWaitingPatients] = useState<WaitingPatient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [nursesLoading, setNursesLoading] = useState(false);
  const [selectedNurse, setSelectedNurse] = useState<string | null>(null);
  const [showFees, setShowFees] = useState(false);
  const [encounterFees, setEncounterFees] = useState<any[]>([]);
  const [totalFees, setTotalFees] = useState(0);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const [newPatient, setNewPatient] = useState<NewPatient>({
    firstName: '',
    lastName: '',
    dob: '',
    phone: '',
    email: '',
    address: '',
    gender: '',
    nationalId: '',
    bloodGroup: '',
    emergencyContact: ''
  });

  const [showPatientForm, setShowPatientForm] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchWaitingPatients();
    fetchDoctors();
    fetchNurses();
    fetchAllPatients();
    fetchInvoices();
  }, []);

  const fetchWaitingPatients = async () => {
    try {
      const response = await apiClient.get<{ activePatients: any[] }>('/dashboard/reception-patients');
      if (response.data) {
        const patients = response.data.activePatients.map((p: any) => ({
          id: p.id,
          encounterId: p.id,
          name: `${p.patient.firstName} ${p.patient.lastName}`,
          mrn: p.patient.mrn,
          phone: p.patient.phone,
          visitStatus: p.visitStatus,
          createdAt: p.createdAt,
          isNewPatient: !p.patient.lastActivityAt || new Date(p.patient.lastActivityAt) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          hasHistory: !!p.patient.lastActivityAt
        }));
        setWaitingPatients(patients);
      }
    } catch (error) {
      console.error('Failed to fetch waiting patients:', error);
    }
  };

  const fetchDoctors = async () => {
    setDoctorsLoading(true);
    try {
      const response = await apiClient.get<{ users: any[] }>('/users');
      if (response.data) {
        const doctorUsers = response.data.users
          .filter((u: any) => u.role === 'DOCTOR' && u.isActive)
          .map((u: any) => ({
            id: u.id,
            name: u.staffProfile?.fullName || u.username,
            specialization: u.staffProfile?.specialization || 'General Practice',
            isAvailable: true,
            currentPatients: 0,
            maxPatients: 10
          }));
        setDoctors(doctorUsers);
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setDoctorsLoading(false);
    }
  };

  const fetchNurses = async () => {
    setNursesLoading(true);
    try {
      const response = await apiClient.get<{ nurses: any[] }>('/assignments/nurses/available');
      if (response.data) {
        const nurseUsers = response.data.nurses.map((n: any) => ({
          id: n.id,
          name: n.fullName,
          isAvailable: n.isAvailable,
          currentPatients: 0,
          maxPatients: 10
        }));
        setNurses(nurseUsers);
      }
    } catch (error) {
      console.error('Failed to fetch nurses:', error);
    } finally {
      setNursesLoading(false);
    }
  };

  const fetchAllPatients = async () => {
    setPatientsLoading(true);
    try {
      const response = await apiClient.get<{ patients: any[] }>('/patients');
      if (response.data) {
        const patients = response.data.patients.map((p: any) => ({
          id: p.id,
          mrn: p.mrn,
          firstName: p.firstName,
          lastName: p.lastName,
          phone: p.phone,
          email: p.email,
          dob: p.dob,
          gender: p.gender,
          isNewPatient: !p.lastActivityAt || new Date(p.lastActivityAt) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          lastVisit: p.lastActivityAt
        }));
        setAllPatients(patients);
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setPatientsLoading(false);
    }
  };

  const getVisitStatusColor = (visitStatus: string) => {
    switch (visitStatus) {
      case 'TRIAGE': return 'bg-blue-50 border-blue-300 text-blue-700';
      case 'DOCTOR_CONSULT': return 'bg-green-50 border-green-300 text-green-700';
      case 'LAB_PENDING': return 'bg-yellow-50 border-yellow-300 text-yellow-700';
      case 'LAB_READY': return 'bg-purple-50 border-purple-300 text-purple-700';
      case 'BILLING': return 'bg-orange-50 border-orange-300 text-orange-700';
      default: return 'bg-gray-50 border-gray-300 text-gray-700';
    }
  };

  const getVisitStatusLabel = (visitStatus: string) => {
    switch (visitStatus) {
      case 'TRIAGE': return 'Triage';
      case 'DOCTOR_CONSULT': return 'Doctor';
      case 'LAB_PENDING': return 'Lab Pending';
      case 'LAB_READY': return 'Lab Ready';
      case 'BILLING': return 'Billing';
      default: return visitStatus;
    }
  };

  const handleCheckIn = async (patientId: string, nurseId?: string) => {
    try {
      console.log('Check-in patientId:', patientId, 'nurseId:', nurseId);
      
      // Check if patient already has an active encounter
      const existingEncounter = waitingPatients.find(p => p.id === patientId);
      if (existingEncounter && existingEncounter.visitStatus !== 'WAITING') {
        alert('Patient is already checked in. Current status: ' + existingEncounter.visitStatus);
        return;
      }
      
      // First create an encounter
      const encounterResponse = await apiClient.post('/medical/patients/encounter', {
        patientId: patientId,
        nurseId: nurseId || undefined,
        visitStatus: 'TRIAGE',
        chiefComplaint: 'Walk-in visit',
        subjective: '',
        objective: '',
        assessment: '',
        plan: ''
      });

      console.log('Encounter response:', encounterResponse);

      if (encounterResponse.error) {
        alert(`Check-in failed: ${encounterResponse.error}`);
        return;
      }

      const encounterId = (encounterResponse.data as any)?.encounter?.id || (encounterResponse.data as any)?.id;
      
      console.log('Encounter ID:', encounterId, 'Nurse ID:', nurseId, 'Type of nurseId:', typeof nurseId);
      
      // If a specific nurse is selected, assign them
      if (nurseId && encounterId) {
        console.log('Attempting nurse assignment...');
        const assignmentResponse = await apiClient.post('/assignments/nurse/assign', {
          encounterId,
          nurseId
        });
        console.log('Assignment response:', assignmentResponse);

        if (assignmentResponse.error) {
          alert(`Patient checked in but nurse assignment failed: ${assignmentResponse.error}`);
        } else {
          alert('Patient checked in and assigned to nurse!');
        }
      } else {
        alert('Patient checked in and sent to triage queue!');
      }

      fetchWaitingPatients(); // Refresh the waiting patients list
    } catch (error) {
      console.error('Check-in error:', error);
      alert('Check-in failed. Please try again.');
    }
  };

  const handlePatientRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/patients/register', {
        firstName: newPatient.firstName,
        lastName: newPatient.lastName,
        dob: newPatient.dob,
        phone: newPatient.phone,
        email: newPatient.email || undefined,
        address: newPatient.address,
        gender: newPatient.gender,
        nationalId: newPatient.nationalId || undefined,
        bloodGroup: newPatient.bloodGroup || undefined,
        emergencyContact: newPatient.emergencyContact || undefined,
      });
      
      if (response.error) {
        alert(`Registration failed: ${response.error}`);
        return;
      }
      
      // Automatically create encounter and send to triage queue
      const patientId = (response.data as any)?.id;
      if (patientId) {
        const encounterResponse = await apiClient.post('/medical/patients/encounter', {
          patientId: patientId,
          visitStatus: 'TRIAGE',
          chiefComplaint: 'Walk-in visit',
          subjective: '',
          objective: '',
          assessment: '',
          plan: ''
        });

        if (encounterResponse.error) {
          alert(`Patient registered but failed to send to triage: ${encounterResponse.error}`);
        } else {
          alert('Patient registered and sent to triage queue!');
        }
      } else {
        alert('Patient registered successfully!');
      }

      setShowPatientForm(false);
      setNewPatient({
        firstName: '',
        lastName: '',
        dob: '',
        phone: '',
        email: '',
        address: '',
        gender: '',
        nationalId: '',
        bloodGroup: '',
        emergencyContact: ''
      });
      fetchAllPatients(); // Refresh patient list
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    }
  };

  const filteredPatients = waitingPatients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.phone.includes(searchQuery) ||
    patient.mrn?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAllPatients = allPatients.filter(patient =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.phone.includes(searchQuery) ||
    patient.mrn?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchEncounterFees = async (encounterId: string) => {
    try {
      const response = await apiClient.get<{ fees: any[], total: number }>(`/fees/encounter/${encounterId}`);
      if (response.data) {
        setEncounterFees(response.data.fees);
        setTotalFees(response.data.total);
        setShowFees(true);
      }
    } catch (error) {
      console.error('Failed to fetch encounter fees:', error);
      alert('Failed to fetch fees. Please try again.');
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await apiClient.get<{ invoices: any[] }>('/billing/invoices');
      if (response.data) {
        setInvoices(response.data.invoices);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    }
  };

  const hasPaidInvoice = (patientId: string) => {
    return invoices.some(invoice => 
      invoice.patientId === patientId && invoice.status === 'PAID'
    );
  };

  const handleCreateInvoice = async (encounterId: string, patientId: string) => {
    try {
      const response = await apiClient.post('/billing/invoices', {
        encounterId,
        patientId,
      });
      if (response.data) {
        alert('Invoice created successfully!');
        fetchInvoices();
      }
    } catch (error) {
      console.error('Failed to create invoice:', error);
      alert('Failed to create invoice. Please try again.');
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      const response = await apiClient.patch(`/billing/invoices/${invoiceId}/mark-paid`);
      if (response.data) {
        alert('Invoice marked as paid!');
        fetchInvoices();
        setShowInvoiceModal(false);

        // Auto-discharge patient if encounter exists
        if (selectedInvoice && selectedInvoice.encounterId) {
          try {
            await apiClient.patch(`/encounters/${selectedInvoice.encounterId}/discharge`, {
              dischargeNotes: 'Auto-discharged after payment'
            });
            alert('Patient automatically discharged!');
            fetchWaitingPatients();
          } catch (dischargeError) {
            console.error('Auto-discharge failed:', dischargeError);
            // Don't alert on auto-discharge failure, payment was successful
          }
        }
      }
    } catch (error) {
      console.error('Failed to mark invoice as paid:', error);
      alert('Failed to mark invoice as paid. Please try again.');
    }
  };

  const handleDischargePatient = async (encounterId: string, patientId: string) => {
    try {
      const response = await apiClient.patch(`/encounters/${encounterId}/discharge`, {
        dischargeNotes: 'Discharged after payment'
      });
      if (response.data) {
        alert('Patient discharged successfully!');
        fetchWaitingPatients();
      }
    } catch (error) {
      console.error('Failed to discharge patient:', error);
      alert('Failed to discharge patient. Please try again.');
    }
  };

  const handleViewInvoice = async (invoiceId: string) => {
    try {
      const response = await apiClient.get(`/billing/invoices/${invoiceId}`);
      if (response.data) {
        setSelectedInvoice(response.data);
        setShowInvoiceModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      alert('Failed to fetch invoice. Please try again.');
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Side - Live Queue (50%) */}
      <div className="w-1/2 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-green-600" />
              Live Waiting Room
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{waitingPatients.length} waiting</span>
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          
          {/* Search in Waiting Room */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search waiting room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No patients found</p>
            </div>
          ) : (
            filteredPatients.map((patient) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`p-4 border-b border-gray-100 hover:bg-green-50 transition-colors cursor-pointer ${
                  hasPaidInvoice(patient.id) ? 'bg-gray-200 opacity-75' : ''
                }`}
                onClick={() => setSelectedPatient(patient)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{patient.name}</h3>
                    <p className="text-xs text-gray-500">MRN: {patient.mrn}</p>
                    {patient.isNewPatient && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">New</span>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getVisitStatusColor(patient.visitStatus)}`}>
                    {getVisitStatusLabel(patient.visitStatus)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(patient.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Phone className="h-3 w-3 mr-1" />
                    {patient.phone}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Right Side - Action Pad (50%) */}
      <div className="w-1/2 bg-gray-50 flex flex-col">
        {/* Action Tabs */}
        <div className="border-b border-gray-200 bg-white">
          <div className="flex space-x-0">
            {(['search', 'register', 'doctors', 'billing'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-4 font-medium transition-colors border-b-2 flex items-center justify-center ${
                  activeTab === tab
                    ? 'border-green-500 text-green-600 bg-green-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab === 'search' && <Search className="h-5 w-5 mr-2" />}
                {tab === 'register' && <UserPlus className="h-5 w-5 mr-2" />}
                {tab === 'doctors' && <Stethoscope className="h-5 w-5 mr-2" />}
                {tab === 'billing' && <DollarSign className="h-5 w-5 mr-2" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'search' && (
            <div className="space-y-4">
              {selectedPatient ? (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Patient Details</h3>
                    <button
                      onClick={() => setSelectedPatient(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <User className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{selectedPatient.name}</p>
                        <p className="text-sm text-gray-600">MRN: {selectedPatient.mrn}</p>
                        {selectedPatient.isNewPatient && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">New Patient</span>
                        )}
                        {selectedPatient.hasHistory && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">Returning Patient</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">MRN</p>
                        <p className="font-medium">{selectedPatient.mrn}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Status</p>
                        <p className="font-medium">{getVisitStatusLabel(selectedPatient.visitStatus)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Phone</p>
                        <p className="font-medium">{selectedPatient.phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Arrived</p>
                        <p className="font-medium">{new Date(selectedPatient.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Assign Nurse (Optional)</label>
                      <select
                        value={selectedNurse || ''}
                        onChange={(e) => setSelectedNurse(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">No specific nurse (any available)</option>
                        {nurses.map(nurse => (
                          <option key={nurse.id} value={nurse.id}>{nurse.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => alert('Full patient record view - to be implemented')}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        View Full Record
                      </button>
                      <button
                        onClick={() => {
                          const targetNurseId = selectedNurse || (nurses.length > 0 ? nurses[0].id : undefined);
                          handleCheckIn(selectedPatient.id, targetNurseId);
                        }}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Send to Triage
                      </button>
                      <button
                        onClick={() => fetchEncounterFees(selectedPatient.encounterId || selectedPatient.id)}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                      >
                        <Receipt className="h-4 w-4 mr-2" />
                        View Fees
                      </button>
                    </div>
                    {selectedPatient.visitStatus === 'BILLING' && (
                      <div className="mt-3">
                        <button
                          onClick={() => handleDischargePatient(selectedPatient.encounterId || selectedPatient.id, selectedPatient.id)}
                          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Discharge Patient
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Patient Database</h3>
                      <span className="text-sm text-gray-500">{filteredAllPatients.length} patients</span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                    {patientsLoading ? (
                      <div className="p-8 text-center text-gray-500">Loading patients...</div>
                    ) : filteredAllPatients.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">No patients found</div>
                    ) : (
                      filteredAllPatients.slice(0, 10).map((patient) => (
                        <div
                          key={patient.id}
                          onClick={() => setSelectedPatient({
                            id: patient.id,
                            name: `${patient.firstName} ${patient.lastName}`,
                            mrn: patient.mrn,
                            phone: patient.phone,
                            visitStatus: 'TRIAGE',
                            createdAt: new Date().toISOString(),
                            isNewPatient: patient.isNewPatient,
                            hasHistory: !patient.isNewPatient
                          })}
                          className="p-4 hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="bg-green-100 p-2 rounded-full">
                                <User className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{patient.firstName} {patient.lastName}</p>
                                <p className="text-sm text-gray-600">MRN: {patient.mrn}</p>
                                {patient.isNewPatient && (
                                  <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">New</span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'register' && (
            <div className="space-y-4">
              {!showPatientForm ? (
                <button
                  onClick={() => setShowPatientForm(true)}
                  className="w-full bg-white rounded-lg border border-gray-200 p-6 flex items-center justify-center space-x-2 hover:bg-green-50 transition-colors"
                >
                  <Plus className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900">Register New Patient</span>
                </button>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <UserPlus className="h-5 w-5 mr-2 text-green-600" />
                      New Patient Registration
                    </h3>
                    <button
                      onClick={() => setShowPatientForm(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <form onSubmit={handlePatientRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input 
                          type="text" 
                          required
                          value={newPatient.firstName}
                          onChange={(e) => setNewPatient({...newPatient, firstName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input 
                          type="text" 
                          required
                          value={newPatient.lastName}
                          onChange={(e) => setNewPatient({...newPatient, lastName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input 
                        type="date" 
                        required
                        value={newPatient.dob}
                        onChange={(e) => setNewPatient({...newPatient, dob: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select 
                        required
                        value={newPatient.gender}
                        onChange={(e) => setNewPatient({...newPatient, gender: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Select gender...</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input 
                        type="tel" 
                        required
                        value={newPatient.phone}
                        onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input 
                        type="email" 
                        value={newPatient.email}
                        onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <textarea
                        value={newPatient.address}
                        onChange={(e) => setNewPatient({...newPatient, address: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent h-20"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
                        <input
                          type="text"
                          value={newPatient.nationalId}
                          onChange={(e) => setNewPatient({...newPatient, nationalId: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                        <select
                          value={newPatient.bloodGroup}
                          onChange={(e) => setNewPatient({...newPatient, bloodGroup: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="">Select blood group...</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                      <input
                        type="tel"
                        value={newPatient.emergencyContact}
                        onChange={(e) => setNewPatient({...newPatient, emergencyContact: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Register Patient
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {activeTab === 'doctors' && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <Stethoscope className="h-5 w-5 mr-2 text-green-600" />
                      Available Doctors
                    </h3>
                    <span className="text-sm text-gray-500">{doctors.length} doctors present</span>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {doctorsLoading ? (
                    <div className="p-8 text-center text-gray-500">Loading doctors...</div>
                  ) : doctors.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No doctors available</div>
                  ) : (
                    doctors.map((doctor) => (
                      <div key={doctor.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${doctor.isAvailable ? 'bg-green-100' : 'bg-red-100'}`}>
                              <Stethoscope className={`h-4 w-4 ${doctor.isAvailable ? 'text-green-600' : 'text-red-600'}`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{doctor.name}</p>
                              <p className="text-sm text-gray-600">{doctor.specialization}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs ${doctor.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {doctor.isAvailable ? 'Available' : 'Busy'}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {doctor.currentPatients}/{doctor.maxPatients} patients
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                      Patient Invoices
                    </h3>
                    <span className="text-sm text-gray-500">{invoices.length} invoices</span>
                  </div>
                </div>
                <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                  {invoices.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Receipt className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No invoices found</p>
                    </div>
                  ) : (
                    invoices.map((invoice) => (
                      <div key={invoice.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${
                              invoice.status === 'PAID' ? 'bg-green-100' : 
                              invoice.status === 'ISSUED' ? 'bg-blue-100' : 'bg-yellow-100'
                            }`}>
                              <Receipt className={`h-4 w-4 ${
                                invoice.status === 'PAID' ? 'text-green-600' : 
                                invoice.status === 'ISSUED' ? 'text-blue-600' : 'text-yellow-600'
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{invoice.invoiceNo}</p>
                              <p className="text-sm text-gray-600">{invoice.patient?.firstName} {invoice.patient?.lastName}</p>
                              <p className="text-xs text-gray-500">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                              invoice.status === 'PAID' ? 'bg-green-100 text-green-700' : 
                              invoice.status === 'ISSUED' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {invoice.status}
                            </span>
                            <p className="text-sm font-semibold text-gray-900 mt-1">
                              ETB {Number(invoice.total).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <button
                            onClick={() => handleViewInvoice(invoice.id)}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            View Invoice
                          </button>
                          {invoice.status !== 'PAID' && (
                            <button
                              onClick={() => handleMarkAsPaid(invoice.id)}
                              className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fees Modal */}
      {showFees && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Receipt className="h-5 w-5 mr-2 text-purple-600" />
                  Encounter Fees
                </h3>
                <button
                  onClick={() => setShowFees(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {encounterFees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No fees recorded for this encounter</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {encounterFees.map((fee, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{fee.description}</p>
                        <p className="text-sm text-gray-500">{new Date(fee.loggedAt).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-400 mr-1">ETB</span>
                        <span className="font-semibold text-gray-900">{Number(fee.amount).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {encounterFees.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <div className="flex items-center">
                      <span className="text-gray-400 mr-1">ETB</span>
                      <span className="text-2xl font-bold text-purple-600">{totalFees.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowFees(false)}
                className="mt-6 w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Receipt className="h-5 w-5 mr-2 text-green-600" />
                  Invoice Details
                </h3>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Invoice Number</p>
                    <p className="font-medium">{selectedInvoice.invoiceNo}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      selectedInvoice.status === 'PAID' ? 'bg-green-100 text-green-700' : 
                      selectedInvoice.status === 'ISSUED' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {selectedInvoice.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-500">Patient</p>
                    <p className="font-medium">{selectedInvoice.patient?.firstName} {selectedInvoice.patient?.lastName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Date</p>
                    <p className="font-medium">{new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Service Breakdown</h4>
                  <div className="space-y-2">
                    {selectedInvoice.items?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{item.description}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity} × ETB {Number(item.unitPrice).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-400 mr-1">ETB</span>
                          <span className="font-semibold text-gray-900">{Number(item.lineTotal).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">ETB {Number(selectedInvoice.subtotal).toFixed(2)}</span>
                  </div>
                  {selectedInvoice.discountAmount && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Discount</span>
                      <span className="font-medium text-red-600">-ETB {Number(selectedInvoice.discountAmount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-green-600">ETB {Number(selectedInvoice.total).toFixed(2)}</span>
                  </div>
                  {selectedInvoice.balance > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Balance Due</span>
                      <span className="font-medium text-red-600">ETB {Number(selectedInvoice.balance).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Payment History</h4>
                    <div className="space-y-2">
                      {selectedInvoice.payments.map((payment: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{payment.method}</p>
                            <p className="text-sm text-gray-500">{new Date(payment.receivedAt).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-400 mr-1">ETB</span>
                            <span className="font-semibold text-green-600">{Number(payment.amount).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedInvoice.status !== 'PAID' && (
                  <button
                    onClick={() => handleMarkAsPaid(selectedInvoice.id)}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}