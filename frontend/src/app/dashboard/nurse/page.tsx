'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api';
import { 
  HeartPulse, 
  Thermometer, 
  Activity,
  Scale,
  Ruler,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  X,
  Stethoscope,
  FileText,
  Pill,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface TriagePatient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  mrn: string;
  appointmentTime: string;
  waitTime: number;
  chiefComplaint: string;
  status: string;
  priority: 'routine' | 'urgent' | 'emergency';
  encounterId: string;
}

interface VitalsData {
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  heartRate: string;
  temperature: string;
  spo2: string;
  weight: string;
  height: string;
  respiratoryRate: string;
}

interface IntakeData {
  chiefComplaint: string;
  currentMedications: string;
  allergies: string;
  medicalHistory: string;
  notes: string;
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

export default function NurseDashboardPage() {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const [triagePatients, setTriagePatients] = useState<TriagePatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<TriagePatient | null>(null);
  const [showVitalsForm, setShowVitalsForm] = useState(false);
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAvailable, setIsAvailable] = useState(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nurseAvailability');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  const [vitalsData, setVitalsData] = useState<VitalsData>({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    temperature: '',
    spo2: '',
    weight: '',
    height: '',
    respiratoryRate: ''
  });

  const [intakeData, setIntakeData] = useState<IntakeData>({
    chiefComplaint: '',
    currentMedications: '',
    allergies: '',
    medicalHistory: '',
    notes: ''
  });

  const [selectedDoctor, setSelectedDoctor] = useState<string>('');

  useEffect(() => {
    fetchTriagePatients();
    fetchDoctors();
    fetchMyAvailability();
  }, []);

  const fetchMyAvailability = async () => {
    try {
      const response = await apiClient.get<{ users: any[] }>('/users');
      if (response.data) {
        const currentUser = response.data.users.find((u: any) => u.id === user?.id);
        if (currentUser && currentUser.staffProfile) {
          setIsAvailable(currentUser.staffProfile.isAvailable || false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch availability:', error);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      const newAvailability = !isAvailable;
      const response = await apiClient.post('/assignments/staff/toggle-availability', {
        isAvailable: newAvailability
      });

      if (response.error) {
        showError(`Failed to toggle availability: ${response.error}`);
        return;
      }

      setIsAvailable(newAvailability);
      localStorage.setItem('nurseAvailability', JSON.stringify(newAvailability));
      showSuccess(`Availability ${newAvailability ? 'enabled' : 'disabled'} successfully!`);
    } catch (error) {
      console.error('Toggle availability error:', error);
      showError('Failed to toggle availability. Please try again.');
    }
  };

  const fetchTriagePatients = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<{ assignments: any[] }>('/assignments/nurse/my-assignments');
      if (response.data) {
        const patients = response.data.assignments.map((a: any) => ({
          id: a.id,
          assignmentId: a.id,
          patientId: a.encounter.patient.id,
          firstName: a.encounter.patient.firstName,
          lastName: a.encounter.patient.lastName,
          mrn: a.encounter.patient.mrn,
          appointmentTime: new Date(a.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          waitTime: Math.floor((Date.now() - new Date(a.assignedAt).getTime()) / 60000),
          chiefComplaint: a.encounter.chiefComplaint || 'Walk-in visit',
          status: a.status,
          priority: 'routine' as const,
          encounterId: a.encounterId
        }));
        setTriagePatients(patients);
      }
    } catch (error) {
      console.error('Failed to fetch nurse assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await apiClient.get<{ doctors: any[] }>('/assignments/doctors/available');
      if (response.data) {
        const doctorUsers = response.data.doctors.map((d: any) => ({
          id: d.id,
          name: d.fullName,
          specialization: d.specialization || 'General Practice'
        }));
        setDoctors(doctorUsers);
      }
    } catch (error) {
      console.error('Failed to fetch available doctors:', error);
    }
  };

  const handleVitalsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    try {
      const response = await apiClient.post(`/medical/encounters/${selectedPatient.encounterId}/vitals`, {
        temperatureC: parseFloat(vitalsData.temperature),
        systolic: parseInt(vitalsData.bloodPressureSystolic),
        diastolic: parseInt(vitalsData.bloodPressureDiastolic),
        pulse: parseInt(vitalsData.heartRate),
        respRate: parseInt(vitalsData.respiratoryRate),
        spo2: parseInt(vitalsData.spo2),
        weightKg: parseFloat(vitalsData.weight),
        heightCm: parseFloat(vitalsData.height)
      });

      if (response.error) {
        showError(`Failed to record vitals: ${response.error}`);
        return;
      }

      setShowVitalsForm(false);
      setVitalsData({
        bloodPressureSystolic: '',
        bloodPressureDiastolic: '',
        heartRate: '',
        temperature: '',
        spo2: '',
        weight: '',
        height: '',
        respiratoryRate: ''
      });
      showSuccess('Vitals recorded successfully!');
    } catch (error) {
      console.error('Vitals recording error:', error);
      showError('Failed to record vitals. Please try again.');
    }
  };

  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    try {
      const response = await apiClient.patch(`/medical/encounters/${selectedPatient.encounterId}`, {
        chiefComplaint: intakeData.chiefComplaint,
        subjective: `Current Medications: ${intakeData.currentMedications}\nAllergies: ${intakeData.allergies}\nMedical History: ${intakeData.medicalHistory}`,
        objective: '',
        assessment: '',
        plan: intakeData.notes
      });

      if (response.error) {
        showError(`Failed to record intake: ${response.error}`);
        return;
      }

      setShowIntakeForm(false);
      setIntakeData({
        chiefComplaint: '',
        currentMedications: '',
        allergies: '',
        medicalHistory: '',
        notes: ''
      });
      showSuccess('Intake recorded successfully!');
    } catch (error) {
      console.error('Intake recording error:', error);
      showError('Failed to record intake. Please try again.');
    }
  };

  const handleRouteToDoctor = async () => {
    if (!selectedPatient || !selectedDoctor) return;

    try {
      const response = await apiClient.post('/assignments/nurse/examination/complete', {
        encounterId: selectedPatient.encounterId,
        doctorId: selectedDoctor,
        subjective: `Chief Complaint: ${intakeData.chiefComplaint}\nCurrent Medications: ${intakeData.currentMedications}\nAllergies: ${intakeData.allergies}\nMedical History: ${intakeData.medicalHistory}`,
        objective: `Vitals recorded: BP ${vitalsData.bloodPressureSystolic}/${vitalsData.bloodPressureDiastolic}, HR ${vitalsData.heartRate}, Temp ${vitalsData.temperature}°C, SpO2 ${vitalsData.spo2}%, Weight ${vitalsData.weight}kg, Height ${vitalsData.height}cm`,
        vitals: {
          temperatureC: parseFloat(vitalsData.temperature),
          systolic: parseInt(vitalsData.bloodPressureSystolic),
          diastolic: parseInt(vitalsData.bloodPressureDiastolic),
          pulse: parseInt(vitalsData.heartRate),
          respRate: parseInt(vitalsData.respiratoryRate),
          spo2: parseInt(vitalsData.spo2),
          weightKg: parseFloat(vitalsData.weight),
          heightCm: parseFloat(vitalsData.height),
        }
      });

      if (response.error) {
        showError(`Failed to route patient: ${response.error}`);
        return;
      }

      // Get doctor name for success message
      const selectedDoctorObj = doctors.find((d: any) => d.id === selectedDoctor);
      const doctorName = selectedDoctorObj?.name || 'Doctor';

      setSelectedPatient(null);
      setSelectedDoctor('');
      setVitalsData({
        bloodPressureSystolic: '',
        bloodPressureDiastolic: '',
        heartRate: '',
        temperature: '',
        spo2: '',
        weight: '',
        height: '',
        respiratoryRate: ''
      });
      setIntakeData({
        chiefComplaint: '',
        currentMedications: '',
        allergies: '',
        medicalHistory: '',
        notes: ''
      });
      showSuccess(`Patient successfully sent to Dr. ${doctorName}!`);
    } catch (error) {
      console.error('Route to doctor error:', error);
      showError('Failed to route patient to doctor. Please try again.');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'bg-red-100 border-red-300 text-red-700';
      case 'urgent': return 'bg-orange-100 border-orange-300 text-orange-700';
      default: return 'bg-green-100 border-green-300 text-green-700';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'emergency': return <AlertTriangle className="h-4 w-4" />;
      case 'urgent': return <Clock className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const filteredPatients = triagePatients.filter(patient =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.mrn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Side - Triage Queue (50%) */}
      <div className="w-1/2 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <HeartPulse className="h-5 w-5 mr-2 text-blue-600" />
              Triage Queue
            </h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleToggleAvailability}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isAvailable 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isAvailable ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                <span>{isAvailable ? 'Available' : 'Unavailable'}</span>
              </button>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{triagePatients.length} patients</span>
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading patients...</div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No patients in triage queue</p>
            </div>
          ) : (
            filteredPatients.map((patient) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="p-4 border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer"
                onClick={() => setSelectedPatient(patient)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">{patient.firstName} {patient.lastName}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(patient.priority)}`}>
                        {getPriorityIcon(patient.priority)}
                        <span className="ml-1 capitalize">{patient.priority}</span>
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{patient.chiefComplaint}</p>
                    <p className="text-xs text-gray-500">MRN: {patient.mrn}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {patient.waitTime > 0 ? `${patient.waitTime}m wait` : 'On time'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {patient.appointmentTime}
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Right Side - Patient Details & Actions (50%) */}
      <div className="w-1/2 bg-gray-50 flex flex-col">
        {selectedPatient ? (
          <>
            {/* Patient Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Patient Details</h3>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                  <p className="text-sm text-gray-600">MRN: {selectedPatient.mrn}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-b border-gray-200 bg-white space-y-2">
              <button
                onClick={() => setShowVitalsForm(!showVitalsForm)}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <HeartPulse className="h-5 w-5" />
                <span>Record Vitals</span>
              </button>
              <button
                onClick={() => setShowIntakeForm(!showIntakeForm)}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
              >
                <FileText className="h-5 w-5" />
                <span>Record Intake</span>
              </button>
            </div>

            {/* Vitals Form */}
            {showVitalsForm && (
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <HeartPulse className="h-5 w-5 mr-2 text-blue-600" />
                    Record Vitals
                  </h4>
                  <button
                    onClick={() => setShowVitalsForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleVitalsSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">BP Systolic</label>
                      <input
                        type="number"
                        required
                        value={vitalsData.bloodPressureSystolic}
                        onChange={(e) => setVitalsData({...vitalsData, bloodPressureSystolic: e.target.value})}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        placeholder="120"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">BP Diastolic</label>
                      <input
                        type="number"
                        required
                        value={vitalsData.bloodPressureDiastolic}
                        onChange={(e) => setVitalsData({...vitalsData, bloodPressureDiastolic: e.target.value})}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        placeholder="80"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Heart Rate</label>
                      <input
                        type="number"
                        required
                        value={vitalsData.heartRate}
                        onChange={(e) => setVitalsData({...vitalsData, heartRate: e.target.value})}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        placeholder="72"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Temperature (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={vitalsData.temperature}
                        onChange={(e) => setVitalsData({...vitalsData, temperature: e.target.value})}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        placeholder="37.0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">SpO2 (%)</label>
                      <input
                        type="number"
                        required
                        value={vitalsData.spo2}
                        onChange={(e) => setVitalsData({...vitalsData, spo2: e.target.value})}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        placeholder="98"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Resp Rate</label>
                      <input
                        type="number"
                        required
                        value={vitalsData.respiratoryRate}
                        onChange={(e) => setVitalsData({...vitalsData, respiratoryRate: e.target.value})}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        placeholder="16"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={vitalsData.weight}
                        onChange={(e) => setVitalsData({...vitalsData, weight: e.target.value})}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        placeholder="70"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Height (cm)</label>
                      <input
                        type="number"
                        required
                        value={vitalsData.height}
                        onChange={(e) => setVitalsData({...vitalsData, height: e.target.value})}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        placeholder="175"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    Save Vitals
                  </button>
                </form>
              </div>
            )}

            {/* Intake Form */}
            {showIntakeForm && (
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                    Record Intake
                  </h4>
                  <button
                    onClick={() => setShowIntakeForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleIntakeSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Chief Complaint</label>
                    <textarea
                      required
                      value={intakeData.chiefComplaint}
                      onChange={(e) => setIntakeData({...intakeData, chiefComplaint: e.target.value})}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm h-16"
                      placeholder="Patient's main concern..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Current Medications</label>
                    <textarea
                      value={intakeData.currentMedications}
                      onChange={(e) => setIntakeData({...intakeData, currentMedications: e.target.value})}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm h-12"
                      placeholder="List current medications..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Allergies</label>
                    <textarea
                      value={intakeData.allergies}
                      onChange={(e) => setIntakeData({...intakeData, allergies: e.target.value})}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm h-12"
                      placeholder="Known allergies..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Medical History</label>
                    <textarea
                      value={intakeData.medicalHistory}
                      onChange={(e) => setIntakeData({...intakeData, medicalHistory: e.target.value})}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm h-12"
                      placeholder="Relevant medical history..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={intakeData.notes}
                      onChange={(e) => setIntakeData({...intakeData, notes: e.target.value})}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm h-12"
                      placeholder="Additional notes..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
                  >
                    Save Intake
                  </button>
                </form>
              </div>
            )}

            {/* Route to Doctor */}
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Stethoscope className="h-5 w-5 mr-2 text-green-600" />
                  Route to Doctor
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Doctor</label>
                    <select
                      required
                      value={selectedDoctor}
                      onChange={(e) => setSelectedDoctor(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Choose a doctor...</option>
                      {doctors.map(doctor => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.name} - {doctor.specialization}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleRouteToDoctor}
                    disabled={!selectedDoctor}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send to Doctor
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Select a patient from the triage queue</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}