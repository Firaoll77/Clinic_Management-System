'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { apiClient } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
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
  DollarSign,
  Calendar,
  FileText,
  Activity,
  AlertCircle,
  CheckCircle,
  Thermometer,
  HeartPulse,
  FlaskConical,
  Printer,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

interface WaitingPatient {
  id: string;
  patientId?: string;
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
  const { showSuccess, showError, showInfo } = useToast();
  const { activeTab: navTab, setActiveTab: setNavTab } = useNavigation();
  const { currentStep, setCurrentStep, completedSteps, completeStep, canAccessStep, getNextStep, getPreviousStep } = useWorkflow();
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

  const [showFullRecordModal, setShowFullRecordModal] = useState(false);
  const [fullRecordPatient, setFullRecordPatient] = useState<any | null>(null);
  const [fullRecordLoading, setFullRecordLoading] = useState(false);
  const [fullRecordTab, setFullRecordTab] = useState<'overview' | 'encounters' | 'labs' | 'billing' | 'appointments'>('overview');

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
    emergencyContact: '',
    attachments: []
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

  const handleViewFullRecord = async (patientIdOrMrn?: string) => {
    const targetId = patientIdOrMrn || selectedPatient?.patientId || selectedPatient?.mrn || selectedPatient?.id;
    if (!targetId) {
      showError('No patient selected to view record');
      return;
    }
    setFullRecordLoading(true);
    setShowFullRecordModal(true);
    setFullRecordTab('overview');
    try {
      const response = await apiClient.get<{ patient: any }>(`/patients/${targetId}`);
      if (response.data && response.data.patient) {
        setFullRecordPatient(response.data.patient);
      } else {
        showError('Patient details could not be retrieved');
      }
    } catch (error: any) {
      console.error('Failed to fetch full patient record:', error);
      showError(error.response?.data?.message || 'Failed to load patient full record');
    } finally {
      setFullRecordLoading(false);
    }
  };

  const fetchWaitingPatients = async () => {
    try {
      const response = await apiClient.get<{ activePatients: any[] }>('/dashboard/reception-patients');
      if (response.data) {
        const patients = response.data.activePatients.map((p: any) => ({
          id: p.id,
          encounterId: p.id,
          patientId: p.patient?.id,
          name: `${p.patient?.firstName || ''} ${p.patient?.lastName || ''}`.trim(),
          mrn: p.patient?.mrn || 'N/A',
          phone: p.patient?.phone || 'N/A',
          visitStatus: p.visitStatus,
          createdAt: p.createdAt,
          isNewPatient: !p.patient?.lastActivityAt || new Date(p.patient.lastActivityAt) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          hasHistory: !!p.patient?.lastActivityAt
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
        showInfo('Patient is already checked in. Current status: ' + existingEncounter.visitStatus);
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
        showError(`Check-in failed: ${encounterResponse.error}`);
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
          showError(`Patient checked in but nurse assignment failed: ${assignmentResponse.error}`);
        } else {
          showSuccess('Patient checked in and assigned to nurse!');
        }
      } else {
        showSuccess('Patient checked in and sent to triage queue!');
      }

      fetchWaitingPatients(); // Refresh the waiting patients list
    } catch (error) {
      console.error('Check-in error:', error);
      showError('Check-in failed. Please try again.');
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
        showError(`Registration failed: ${response.error}`);
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
          showError(`Patient registered but failed to send to triage: ${encounterResponse.error}`);
        } else {
          showSuccess('Patient registered and sent to triage queue!');
          
          // Upload attachments if any
          const encounterId = (encounterResponse.data as any)?.encounter?.id;
          if (encounterId && newPatient.attachments && newPatient.attachments.length > 0) {
            for (const file of newPatient.attachments) {
              const formData = new FormData();
              formData.append('file', file);
              formData.append('encounterId', encounterId);
              
              try {
                await apiClient.upload('/attachments/upload', formData);
              } catch (uploadError) {
                console.error('Failed to upload attachment:', uploadError);
                showError(`Failed to upload ${file.name}`);
              }
            }
          }
        }
      } else {
        showSuccess('Patient registered successfully!');
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
        emergencyContact: '',
        attachments: []
      });
      fetchAllPatients(); // Refresh patient list
    } catch (error) {
      console.error('Registration error:', error);
      showError('Registration failed. Please try again.');
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
      showError('Failed to fetch fees. Please try again.');
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

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      const response = await apiClient.patch(`/billing/invoices/${invoiceId}/mark-paid`);
      if (response.data) {
        showSuccess('Invoice marked as paid!');
        fetchInvoices();
        setShowInvoiceModal(false);

        // Auto-discharge patient if encounter exists
        if (selectedInvoice && selectedInvoice.encounterId) {
          try {
            await apiClient.patch(`/encounters/${selectedInvoice.encounterId}/discharge`, {
              dischargeNotes: 'Auto-discharged after payment'
            });
            showSuccess('Patient automatically discharged!');
            fetchWaitingPatients();
          } catch (dischargeError) {
            console.error('Auto-discharge failed:', dischargeError);
            // Don't alert on auto-discharge failure, payment was successful
          }
        }
      }
    } catch (error) {
      console.error('Failed to mark invoice as paid:', error);
      showError('Failed to mark invoice as paid. Please try again.');
    }
  };

  const handleDischargePatient = async (encounterId: string) => {
    try {
      const response = await apiClient.patch(`/encounters/${encounterId}/discharge`, {
        dischargeNotes: 'Discharged after payment'
      });
      if (response.data) {
        showSuccess('Patient discharged successfully!');
        fetchWaitingPatients();
      }
    } catch (error) {
      console.error('Failed to discharge patient:', error);
      showError('Failed to discharge patient. Please try again.');
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
      showError('Failed to fetch invoice. Please try again.');
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {currentStep === 'queue' && (
      <>
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
        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
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
                    onClick={() => handleViewFullRecord(selectedPatient.patientId || selectedPatient.id || selectedPatient.mrn)}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center font-medium"
                  >
                    <FileText className="h-4 w-4 mr-2" />
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
                      onClick={() => handleDischargePatient(selectedPatient.encounterId || selectedPatient.id)}
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
                        patientId: patient.id,
                        name: `${patient.firstName} ${patient.lastName}`,
                        mrn: patient.mrn,
                        phone: patient.phone,
                        visitStatus: 'TRIAGE',
                        createdAt: new Date().toISOString(),
                        isNewPatient: patient.isNewPatient,
                        hasHistory: !patient.isNewPatient
                      })}
                      className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                    >
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
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewFullRecord(patient.id);
                          }}
                          className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-medium border border-emerald-200 transition-colors flex items-center"
                          title="View Full Patient Record"
                        >
                          <FileText className="h-3.5 w-3.5 mr-1" />
                          Record
                        </button>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      </>
      )}

      {currentStep === 'registration' && (
        <div className="w-full bg-gray-50 flex flex-col p-6 overflow-y-auto">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attachments (Optional)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setNewPatient({...newPatient, attachments: files});
                      }}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        {newPatient.attachments && newPatient.attachments.length > 0 
                          ? `${newPatient.attachments.length} file(s) selected` 
                          : 'Click to upload files'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF, JPG, PNG, DOC, DOCX (max 10MB each)
                      </p>
                    </label>
                    {newPatient.attachments && newPatient.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {newPatient.attachments.map((file, index) => (
                          <div key={index} className="text-xs text-gray-600 flex items-center justify-between bg-gray-100 p-2 rounded">
                            <span className="truncate">{file.name}</span>
                            <span className="text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                          </div>
                        ))}
                      </div>
                    )}
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

      {currentStep === 'appointments' && (
        <div className="w-full bg-gray-50 flex flex-col p-6 overflow-y-auto">
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

      {currentStep === 'billing' && (
        <div className="w-full bg-gray-50 flex flex-col p-6 overflow-y-auto">
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
                          {formatCurrency(invoice.total)}
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
                        <span className="font-semibold text-gray-900">{formatCurrency(fee.amount)}</span>
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
                      <span className="text-2xl font-bold text-purple-600">{formatCurrency(totalFees)}</span>
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
                          <p className="text-sm text-gray-500">Qty: {item.quantity} × {formatCurrency(item.unitPrice)}</p>
                        </div>
                        <div className="flex items-center">
                          <span className="font-semibold text-gray-900">{formatCurrency(item.lineTotal)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  {selectedInvoice.discountAmount && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Discount</span>
                      <span className="font-medium text-red-600">-{formatCurrency(selectedInvoice.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-green-600">{formatCurrency(selectedInvoice.total)}</span>
                  </div>
                  {selectedInvoice.balance > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Balance Due</span>
                      <span className="font-medium text-red-600">{formatCurrency(selectedInvoice.balance)}</span>
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
                            <span className="font-semibold text-green-600">{formatCurrency(payment.amount)}</span>
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

      {/* Full Patient Record Modal */}
      {showFullRecordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-xl">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold tracking-tight">
                      {fullRecordPatient ? `${fullRecordPatient.firstName} ${fullRecordPatient.lastName}` : 'Patient Record'}
                    </h2>
                    {fullRecordPatient?.bloodGroup && (
                      <span className="px-2.5 py-0.5 bg-white/20 text-white rounded-full text-xs font-semibold">
                        {fullRecordPatient.bloodGroup}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/80 font-mono mt-0.5">
                    MRN: {fullRecordPatient?.mrn || 'Loading...'} &bull; Phone: {fullRecordPatient?.phone || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {fullRecordPatient && (
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center text-xs font-medium"
                    title="Print Record"
                  >
                    <Printer className="h-4 w-4 mr-1.5" />
                    Print
                  </button>
                )}
                <button
                  onClick={() => setShowFullRecordModal(false)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Tabs navigation */}
            <div className="flex border-b border-gray-200 bg-gray-50 px-6 pt-2 space-x-2 overflow-x-auto">
              <button
                onClick={() => setFullRecordTab('overview')}
                className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center space-x-1.5 ${
                  fullRecordTab === 'overview'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <User className="h-4 w-4" />
                <span>Demographics & Overview</span>
              </button>

              <button
                onClick={() => setFullRecordTab('encounters')}
                className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center space-x-1.5 ${
                  fullRecordTab === 'encounters'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Activity className="h-4 w-4" />
                <span>Visits & Vitals ({fullRecordPatient?.encounters?.length || 0})</span>
              </button>

              <button
                onClick={() => setFullRecordTab('labs')}
                className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center space-x-1.5 ${
                  fullRecordTab === 'labs'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FlaskConical className="h-4 w-4" />
                <span>Lab Orders & Results</span>
              </button>

              <button
                onClick={() => setFullRecordTab('billing')}
                className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center space-x-1.5 ${
                  fullRecordTab === 'billing'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <DollarSign className="h-4 w-4" />
                <span>Invoices & Billing ({fullRecordPatient?.invoices?.length || 0})</span>
              </button>

              <button
                onClick={() => setFullRecordTab('appointments')}
                className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center space-x-1.5 ${
                  fullRecordTab === 'appointments'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>Appointments ({fullRecordPatient?.appointments?.length || 0})</span>
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
              {fullRecordLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <RefreshCw className="h-8 w-8 animate-spin text-emerald-600 mb-3" />
                  <p className="text-sm font-medium">Loading comprehensive patient record...</p>
                </div>
              ) : !fullRecordPatient ? (
                <div className="text-center py-16 text-gray-500">
                  <AlertCircle className="h-10 w-10 mx-auto text-amber-500 mb-2" />
                  <p className="text-base font-medium text-gray-800">No patient details found</p>
                  <p className="text-sm text-gray-500">Could not retrieve complete record for this patient.</p>
                </div>
              ) : (
                <div>
                  {/* Tab 1: Overview & Demographics */}
                  {fullRecordTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Top quick summary cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                          <p className="text-xs text-gray-500 font-medium">Total Encounters</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">{fullRecordPatient.encounters?.length || 0}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                          <p className="text-xs text-gray-500 font-medium">Invoices Count</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">{fullRecordPatient.invoices?.length || 0}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                          <p className="text-xs text-gray-500 font-medium">Total Invoiced</p>
                          <p className="text-xl font-bold text-emerald-600 mt-1">
                            {formatCurrency(fullRecordPatient.invoices?.reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0))}
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                          <p className="text-xs text-gray-500 font-medium">Outstanding Balance</p>
                          <p className="text-xl font-bold text-amber-600 mt-1">
                            {formatCurrency(fullRecordPatient.invoices?.reduce((sum: number, inv: any) => sum + Number(inv.balance || 0), 0))}
                          </p>
                        </div>
                      </div>

                      {/* Patient Information Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Demographics Card */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
                          <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-700 flex items-center">
                            <User className="h-4 w-4 mr-2" /> Demographics & Identity
                          </h3>
                          <div className="grid grid-cols-2 gap-y-3 text-sm">
                            <div>
                              <span className="text-xs text-gray-500 block">Full Name</span>
                              <span className="font-semibold text-gray-900">{fullRecordPatient.firstName} {fullRecordPatient.lastName}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 block">MRN</span>
                              <span className="font-mono font-semibold text-emerald-700">{fullRecordPatient.mrn}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 block">Date of Birth</span>
                              <span className="font-medium text-gray-900">{fullRecordPatient.dob ? new Date(fullRecordPatient.dob).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 block">Gender</span>
                              <span className="font-medium text-gray-900 capitalize">{fullRecordPatient.gender || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 block">National ID</span>
                              <span className="font-medium text-gray-900">{fullRecordPatient.nationalId || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 block">Blood Group</span>
                              <span className="inline-block px-2 py-0.5 bg-red-50 text-red-700 font-semibold rounded text-xs">
                                {fullRecordPatient.bloodGroup || 'Unknown'}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 block">Registration Date</span>
                              <span className="text-gray-700 text-xs">
                                {fullRecordPatient.createdAt ? new Date(fullRecordPatient.createdAt).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 block">Last Active</span>
                              <span className="text-gray-700 text-xs">
                                {fullRecordPatient.lastActivityAt ? new Date(fullRecordPatient.lastActivityAt).toLocaleString() : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Contact & Address Card */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
                          <h3 className="text-sm font-semibold uppercase tracking-wider text-teal-700 flex items-center">
                            <Phone className="h-4 w-4 mr-2" /> Contact & Emergency
                          </h3>
                          <div className="space-y-3 text-sm">
                            <div>
                              <span className="text-xs text-gray-500 block">Primary Phone</span>
                              <span className="font-medium text-gray-900">{fullRecordPatient.phone || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 block">Email Address</span>
                              <span className="font-medium text-gray-900">{fullRecordPatient.email || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 block">Residential Address</span>
                              <span className="font-medium text-gray-900">{fullRecordPatient.address || 'N/A'}</span>
                            </div>
                            <div className="pt-2 border-t border-gray-100">
                              <span className="text-xs text-gray-500 block">Emergency Contact</span>
                              <span className="font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded inline-block mt-0.5">
                                {fullRecordPatient.emergencyContact || 'None provided'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Allergies & Alerts */}
                      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-rose-700 flex items-center">
                          <ShieldAlert className="h-4 w-4 mr-2 text-rose-600" /> Allergies & Clinical Alerts
                        </h3>
                        {(!fullRecordPatient.allergies || fullRecordPatient.allergies.length === 0) ? (
                          <p className="text-sm text-gray-500 italic">No known allergies recorded for this patient.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {fullRecordPatient.allergies.map((allergy: any) => (
                              <div key={allergy.id} className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-3">
                                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-rose-900 text-sm">{allergy.substance}</span>
                                    {allergy.severity && (
                                      <span className="px-1.5 py-0.5 text-xs bg-rose-200 text-rose-800 rounded font-medium">
                                        {allergy.severity}
                                      </span>
                                    )}
                                  </div>
                                  {allergy.notes && (
                                    <p className="text-xs text-rose-700 mt-1">{allergy.notes}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Encounters & Vitals */}
                  {fullRecordTab === 'encounters' && (
                    <div className="space-y-4">
                      {(!fullRecordPatient.encounters || fullRecordPatient.encounters.length === 0) ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
                          <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>No encounters or clinical visits on record.</p>
                        </div>
                      ) : (
                        fullRecordPatient.encounters.map((enc: any, idx: number) => (
                          <div key={enc.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
                            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-gray-900">Visit #{fullRecordPatient.encounters.length - idx}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getVisitStatusColor(enc.visitStatus)}`}>
                                    {getVisitStatusLabel(enc.visitStatus)}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {new Date(enc.createdAt).toLocaleString()}
                                </p>
                              </div>
                              {enc.signedAt && (
                                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded font-medium flex items-center">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Signed by {enc.signedBy || 'Doctor'}
                                </span>
                              )}
                            </div>

                            {/* Vitals summary if recorded */}
                            {enc.vitals && enc.vitals.length > 0 && (
                              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center">
                                  <HeartPulse className="h-3.5 w-3.5 mr-1.5 text-rose-500" />
                                  Recorded Vitals
                                </p>
                                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                                  <div className="bg-white p-2 rounded border border-gray-100">
                                    <span className="text-gray-500 block">BP</span>
                                    <span className="font-bold text-gray-900">
                                      {enc.vitals[0].systolic && enc.vitals[0].diastolic
                                        ? `${enc.vitals[0].systolic}/${enc.vitals[0].diastolic} mmHg`
                                        : 'N/A'}
                                    </span>
                                  </div>
                                  <div className="bg-white p-2 rounded border border-gray-100">
                                    <span className="text-gray-500 block">Pulse</span>
                                    <span className="font-bold text-gray-900">{enc.vitals[0].pulse ? `${enc.vitals[0].pulse} bpm` : 'N/A'}</span>
                                  </div>
                                  <div className="bg-white p-2 rounded border border-gray-100">
                                    <span className="text-gray-500 block">Temp</span>
                                    <span className="font-bold text-gray-900">{enc.vitals[0].temperatureC ? `${enc.vitals[0].temperatureC} °C` : 'N/A'}</span>
                                  </div>
                                  <div className="bg-white p-2 rounded border border-gray-100">
                                    <span className="text-gray-500 block">SpO2</span>
                                    <span className="font-bold text-gray-900">{enc.vitals[0].spo2 ? `${enc.vitals[0].spo2} %` : 'N/A'}</span>
                                  </div>
                                  <div className="bg-white p-2 rounded border border-gray-100">
                                    <span className="text-gray-500 block">Weight</span>
                                    <span className="font-bold text-gray-900">{enc.vitals[0].weightKg ? `${enc.vitals[0].weightKg} kg` : 'N/A'}</span>
                                  </div>
                                  <div className="bg-white p-2 rounded border border-gray-100">
                                    <span className="text-gray-500 block">BMI</span>
                                    <span className="font-bold text-gray-900">{enc.vitals[0].bmi || 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Clinical SOAP Notes */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              {enc.chiefComplaint && (
                                <div className="p-3 bg-gray-50 rounded-lg">
                                  <span className="font-bold text-gray-700 block mb-1">Chief Complaint</span>
                                  <p className="text-gray-800">{enc.chiefComplaint}</p>
                                </div>
                              )}
                              {enc.assessment && (
                                <div className="p-3 bg-emerald-50 rounded-lg">
                                  <span className="font-bold text-emerald-800 block mb-1">Assessment / Diagnosis</span>
                                  <p className="text-emerald-950">{enc.assessment}</p>
                                  {enc.icd10Code && (
                                    <span className="inline-block mt-1 font-mono font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded text-[10px]">
                                      ICD-10: {enc.icd10Code}
                                    </span>
                                  )}
                                </div>
                              )}
                              {enc.subjective && (
                                <div className="p-3 bg-gray-50 rounded-lg">
                                  <span className="font-bold text-gray-700 block mb-1">Subjective (History)</span>
                                  <p className="text-gray-800">{enc.subjective}</p>
                                </div>
                              )}
                              {enc.objective && (
                                <div className="p-3 bg-gray-50 rounded-lg">
                                  <span className="font-bold text-gray-700 block mb-1">Objective (Physical Exam)</span>
                                  <p className="text-gray-800">{enc.objective}</p>
                                </div>
                              )}
                              {enc.plan && (
                                <div className="p-3 bg-blue-50 rounded-lg md:col-span-2">
                                  <span className="font-bold text-blue-800 block mb-1">Treatment Plan & Prescription</span>
                                  <p className="text-blue-950 whitespace-pre-wrap">{enc.plan}</p>
                                </div>
                              )}
                              {enc.dischargeNotes && (
                                <div className="p-3 bg-purple-50 rounded-lg md:col-span-2">
                                  <span className="font-bold text-purple-800 block mb-1">Discharge Instructions</span>
                                  <p className="text-purple-950">{enc.dischargeNotes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Tab 3: Lab Orders & Results */}
                  {fullRecordTab === 'labs' && (
                    <div className="space-y-4">
                      {(() => {
                        const allLabOrders = fullRecordPatient.encounters?.flatMap((e: any) => e.labOrders || []) || [];
                        if (allLabOrders.length === 0) {
                          return (
                            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
                              <FlaskConical className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p>No laboratory orders or results found for this patient.</p>
                            </div>
                          );
                        }
                        return allLabOrders.map((order: any) => (
                          <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                              <div>
                                <span className="font-semibold text-sm text-gray-900">Lab Order #{order.id.substring(0, 8)}</span>
                                <span className="text-xs text-gray-500 ml-2">{new Date(order.orderedAt).toLocaleString()}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                order.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {order.status}
                              </span>
                            </div>

                            {order.results && order.results.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                                      <th className="py-2 px-3">Test Name</th>
                                      <th className="py-2 px-3">Department</th>
                                      <th className="py-2 px-3">Result</th>
                                      <th className="py-2 px-3">Reference Range</th>
                                      <th className="py-2 px-3">Flag</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {order.results.map((result: any) => (
                                      <tr key={result.id} className="hover:bg-gray-50">
                                        <td className="py-2 px-3 font-medium text-gray-900">{result.labTest?.name || 'Lab Test'}</td>
                                        <td className="py-2 px-3 text-gray-600">{result.labTest?.department || '-'}</td>
                                        <td className="py-2 px-3 font-bold text-gray-900">{result.value} {result.unit || ''}</td>
                                        <td className="py-2 px-3 text-gray-500">{result.referenceRange || '-'}</td>
                                        <td className="py-2 px-3">
                                          {result.flag && result.flag !== 'N' ? (
                                            <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 font-bold rounded text-[10px]">
                                              {result.flag}
                                            </span>
                                          ) : (
                                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px]">
                                              Normal
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 italic">Results pending entry from laboratory technician.</p>
                            )}
                          </div>
                        ));
                      })()}
                    </div>
                  )}

                  {/* Tab 4: Invoices & Billing */}
                  {fullRecordTab === 'billing' && (
                    <div className="space-y-4">
                      {(!fullRecordPatient.invoices || fullRecordPatient.invoices.length === 0) ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
                          <Receipt className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>No invoices or payments recorded for this patient.</p>
                        </div>
                      ) : (
                        fullRecordPatient.invoices.map((inv: any) => (
                          <div key={inv.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-gray-900">{inv.invoiceNo}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                                    inv.status === 'ISSUED' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    {inv.status}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500">{new Date(inv.createdAt).toLocaleString()}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs text-gray-500 block">Total</span>
                                <span className="text-base font-bold text-emerald-700">{formatCurrency(inv.total)}</span>
                                {inv.balance > 0 && (
                                  <span className="text-xs font-semibold text-rose-600 block">Due: {formatCurrency(inv.balance)}</span>
                                )}
                              </div>
                            </div>

                            {/* Items */}
                            {inv.items && inv.items.length > 0 && (
                              <div className="space-y-1 text-xs">
                                {inv.items.map((it: any) => (
                                  <div key={it.id} className="flex justify-between py-1 border-b border-gray-50">
                                    <span className="text-gray-700">{it.description} (x{it.quantity})</span>
                                    <span className="font-semibold text-gray-900">{formatCurrency(it.lineTotal)}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Payments recorded */}
                            {inv.payments && inv.payments.length > 0 && (
                              <div className="bg-emerald-50/50 p-2 rounded text-xs">
                                <span className="font-semibold text-emerald-800 block mb-1">Payments:</span>
                                {inv.payments.map((p: any) => (
                                  <div key={p.id} className="flex justify-between text-emerald-900">
                                    <span>{p.method} on {new Date(p.receivedAt).toLocaleDateString()}</span>
                                    <span className="font-bold">{formatCurrency(p.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Tab 5: Appointments */}
                  {fullRecordTab === 'appointments' && (
                    <div className="space-y-3">
                      {(!fullRecordPatient.appointments || fullRecordPatient.appointments.length === 0) ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
                          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>No appointments recorded for this patient.</p>
                        </div>
                      ) : (
                        fullRecordPatient.appointments.map((apt: any) => (
                          <div key={apt.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                                <Calendar className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-semibold text-sm text-gray-900">
                                  {new Date(apt.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                </p>
                                <p className="text-xs text-gray-500">{apt.reason || 'Routine Consultation'} ({apt.durationMin} mins)</p>
                              </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                              apt.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {apt.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-gray-100 border-t border-gray-200 flex justify-end space-x-2">
              <button
                onClick={() => setShowFullRecordModal(false)}
                className="px-5 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}