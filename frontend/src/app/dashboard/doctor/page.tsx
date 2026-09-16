/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { apiClient } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import { evaluateCdsRules } from '@/lib/cdsRules';
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Activity,
  AlertCircle,
  CheckCircle,
  Stethoscope,
  Edit,
  Plus,
  HeartPulse,
  Thermometer,
  Scale,
  Pill,
  FlaskConical,
  Beaker,
  X,
  Save,
  Printer,
  RefreshCw,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface Patient {
  id: string;
  assignmentId?: string;
  patientId: string;
  firstName: string;
  lastName: string;
  mrn: string;
  appointmentTime: string;
  arrivalTime?: string;
  spentTime?: string;
  reason: string;
  status: 'waiting' | 'in-progress' | 'completed';
  urgency: 'routine' | 'urgent' | 'stat';
  encounterId?: string;
}

interface Vitals {
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  spo2: number;
  weight: number;
  height: number;
  respiratoryRate: number;
  recordedAt: string;
}

interface NurseIntake {
  chiefComplaint: string;
  currentMedications: string;
  allergies: string;
  medicalHistory: string;
  notes: string;
  recordedAt: string;
}

interface Encounter {
  id: string;
  chiefComplaint: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  icd10Code?: string;
  createdAt: string;
  patient?: {
    allergies?: Array<{ substance: string }>;
  };
  vitals?: Array<{
    systolic?: number;
    diastolic?: number;
    bloodPressure?: string;
    pulse?: number;
    heartRate?: number;
    temperatureC?: number;
    temperature?: number;
    spo2?: number;
    weightKg?: number;
    weight?: number;
    heightCm?: number;
    height?: number;
    respRate?: number;
    respiratoryRate?: number;
    recordedAt: string;
  }>;
}

interface LabOrder {
  id: string;
  testType: string;
  priority: 'routine' | 'urgent' | 'stat';
  notes?: string;
  status?: string;
  results?: LabResult[];
  encounterId?: string;
  patientId?: string;
  doctorId?: string;
  createdAt: string;
}

interface LabResult {
  id: string;
  value: string;
  unit?: string;
  flag?: string;
  referenceRange?: string;
  labTest?: {
    id: string;
    name: string;
  };
}

interface LabTech {
  id: string;
  username: string;
  staffProfile?: {
    id: string;
    fullName?: string;
    isAvailable?: boolean;
  };
  isAvailable?: boolean;
}

interface EncounterForm {
  chiefComplaint: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  icd10Code: string;
  labResultInterpretation: string;
}

interface PrescriptionForm {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface LabOrderForm {
  testType: string;
  priority: 'routine' | 'urgent' | 'stat';
  notes: string;
  labTechId: string;
}

interface User {
  id: string;
  staffProfile?: {
    id: string;
    isAvailable?: boolean;
  };
}

interface Assignment {
  id: string;
  encounterId: string;
  assignedAt: string;
  status: string;
  encounter: {
    id: string;
    chiefComplaint: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
      mrn?: string;
      allergies?: Array<{ substance: string }>;
    };
    vitals?: Array<{
      systolic?: number;
      diastolic?: number;
      bloodPressure?: string;
      pulse?: number;
      heartRate?: number;
      temperatureC?: number;
      temperature?: number;
      spo2?: number;
      weightKg?: number;
      weight?: number;
      heightCm?: number;
      height?: number;
      respRate?: number;
      respiratoryRate?: number;
      recordedAt: string;
    }>;
  };
}

interface VitalsResponse {
  vitals: Array<{
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    spo2: number;
    weight: number;
    height: number;
    respiratoryRate: number;
    recordedAt: string;
  }>;
}

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const { activeTab: navTab, setActiveTab: setNavTab } = useNavigation();
  const { currentStep, setCurrentStep, completedSteps, completeStep, canAccessStep, getNextStep, getPreviousStep } = useWorkflow();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [nurseIntake, setNurseIntake] = useState<NurseIntake | null>(null);
  const [vitals, setVitals] = useState<Vitals | null>(null);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [patientLabOrders, setPatientLabOrders] = useState<LabOrder[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);

  const [encounterForm, setEncounterForm] = useState<EncounterForm>({
    chiefComplaint: '',
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    icd10Code: '',
    labResultInterpretation: ''
  });

  const [prescriptionForm, setPrescriptionForm] = useState<PrescriptionForm>({
    medication: '',
    dosage: '',
    frequency: '',
    duration: ''
  });

  const [currentEncounterId, setCurrentEncounterId] = useState<string | null>(null);

  const [labOrderForm, setLabOrderForm] = useState<LabOrderForm>({
    testType: '',
    priority: 'routine' as 'routine' | 'urgent' | 'stat',
    notes: '',
    labTechId: ''
  });

  const [availableLabTechs, setAvailableLabTechs] = useState<LabTech[]>([]);

  const [isAvailable, setIsAvailable] = useState<boolean>(true);

  useEffect(() => {
    fetchDoctorPatients();
    fetchAvailableLabTechs();
    fetchDoctorAvailability();

    // Auto-poll doctor patient queue every 10 seconds so patients sent by nurse appear immediately
    const interval = setInterval(() => {
      fetchDoctorPatients(true);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchDoctorAvailability = async () => {
    try {
      const response = await apiClient.get<{ users: User[] }>('/users');
      if (response.data) {
        const currentUser = response.data.users.find((u: User) => u.id === user?.id);
        if (currentUser && currentUser.staffProfile) {
          setIsAvailable(currentUser.staffProfile.isAvailable !== false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch doctor availability:', error);
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
      showSuccess(`Availability set to ${newAvailability ? 'Available' : 'Unavailable'}!`);
    } catch (error) {
      console.error('Toggle availability error:', error);
      showError('Failed to toggle availability.');
    }
  };

  const fetchAvailableLabTechs = async () => {
    try {
      const response = await apiClient.get<{ labTechs: LabTech[] }>('/assignments/lab-techs/available');
      if (response.data) {
        setAvailableLabTechs(response.data.labTechs);
      }
    } catch (error) {
      console.error('Failed to fetch available lab technicians:', error);
    }
  };

  const fetchDoctorPatients = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await apiClient.get<{ assignments: Assignment[] }>('/assignments/doctor/my-assignments');
      if (response.data && Array.isArray(response.data.assignments)) {
        const allPatients = response.data.assignments
          .filter((a: Assignment) => a && a.encounter && a.encounter.patient)
          .map((a: Assignment) => ({
            id: a.id,
            assignmentId: a.id,
            patientId: a.encounter.patient.id,
            firstName: a.encounter.patient.firstName,
            lastName: a.encounter.patient.lastName,
            mrn: a.encounter.patient.mrn || 'N/A',
            appointmentTime: a.assignedAt ? new Date(a.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now',
            status: (a.status === 'PENDING' ? 'waiting' : a.status === 'ACCEPTED' ? 'in-progress' : 'completed') as 'waiting' | 'in-progress' | 'completed',
            urgency: 'routine' as const,
            reason: a.encounter.chiefComplaint || 'Nurse Examination Complete',
            encounterId: a.encounterId
          }));
        setPatients(allPatients);
      }
    } catch (error) {
      console.error('Failed to fetch doctor assignments:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleAcceptPatient = async (assignmentId: string) => {
    try {
      const response = await apiClient.post(`/assignments/doctor/assignment/${assignmentId}/respond`, {
        action: 'accept'
      });
      if (response.data) {
        showSuccess('Patient accepted into consultation!');
        fetchDoctorPatients(true);
      }
    } catch (error) {
      console.error('Failed to accept patient:', error);
      showError('Failed to accept patient');
    }
  };

  const fetchPatientData = async (patientId: string, preferredEncounterId?: string) => {
    try {
      // Fetch encounters (includes nurse intake)
      const encounterResponse = await apiClient.get<{ encounters: Encounter[] }>(`/medical/patients/${patientId}/encounters`);
      let currentEncounter: Encounter | null = null;

      if (encounterResponse.data && encounterResponse.data.encounters.length > 0) {
        currentEncounter = (preferredEncounterId
          ? encounterResponse.data.encounters.find((e: Encounter) => e.id === preferredEncounterId)
          : null) || encounterResponse.data.encounters[0];

        // Robust parser for subjective fields supporting multiline / variable spacing
        const extractField = (text: string, label: string): string => {
          if (!text) return '';
          const regex = new RegExp(
            `${label}:\\s*([\\s\\S]*?)(?=(?:Chief Complaint|Current Medications|Allergies|Medical History|Nurse Notes):|$)`,
            'i'
          );
          const m = text.match(regex);
          return m && m[1] ? m[1].trim() : '';
        };

        const subjective = currentEncounter.subjective || '';
        const chiefComplaint = extractField(subjective, 'Chief Complaint') || currentEncounter.chiefComplaint || '';
        const currentMedications = extractField(subjective, 'Current Medications');
        const allergies = extractField(subjective, 'Allergies') || 
          (currentEncounter.patient?.allergies && currentEncounter.patient.allergies.length > 0
            ? currentEncounter.patient.allergies.map((a: { substance: string }) => a.substance).join(', ')
            : '');
        const medicalHistory = extractField(subjective, 'Medical History');
        const notes = extractField(subjective, 'Nurse Notes') || currentEncounter.plan || '';

        setNurseIntake({
          chiefComplaint,
          currentMedications,
          allergies,
          medicalHistory,
          notes,
          recordedAt: currentEncounter.createdAt
        });

        // Pre-fill encounterForm with chief complaint and intake info
        setEncounterForm((prev: EncounterForm) => ({
          ...prev,
          chiefComplaint: chiefComplaint || prev.chiefComplaint,
          subjective: subjective || prev.subjective,
        }));

        setEncounters(encounterResponse.data.encounters.map((e: Encounter) => ({
          id: e.id,
          chiefComplaint: e.chiefComplaint,
          subjective: e.subjective,
          objective: e.objective,
          assessment: e.assessment,
          plan: e.plan,
          icd10Code: e.icd10Code,
          createdAt: e.createdAt
        })));
      }

      // Check if currentEncounter has vitals
      if (currentEncounter?.vitals && currentEncounter.vitals.length > 0) {
        const lv = currentEncounter.vitals[0];
        setVitals({
          bloodPressure: lv.systolic && lv.diastolic ? `${lv.systolic}/${lv.diastolic}` : lv.bloodPressure || 'N/A',
          heartRate: (lv.pulse ?? lv.heartRate) ?? 0,
          temperature: (lv.temperatureC ?? lv.temperature) ?? 0,
          spo2: lv.spo2 ?? 0,
          weight: (lv.weightKg ?? lv.weight) ?? 0,
          height: (lv.heightCm ?? lv.height) ?? 0,
          respiratoryRate: (lv.respRate ?? lv.respiratoryRate) ?? 0,
          recordedAt: lv.recordedAt
        });
      } else {
        // Fallback: fetch vitals
        const vitalsResponse = await apiClient.get<VitalsResponse>(`/medical/patients/${patientId}/vitals`);
        if (vitalsResponse.data && vitalsResponse.data.vitals.length > 0) {
          const latestVitals = vitalsResponse.data.vitals[0];
          setVitals({
            bloodPressure: latestVitals.bloodPressure,
            heartRate: latestVitals.heartRate,
            temperature: latestVitals.temperature,
            spo2: latestVitals.spo2,
            weight: latestVitals.weight,
            height: latestVitals.height,
            respiratoryRate: latestVitals.respiratoryRate,
            recordedAt: latestVitals.recordedAt
          });
        }
      }

      // Fetch patient lab history & results
      const labResponse = await apiClient.get<{ labOrders: LabOrder[] }>(`/lab/patient/${patientId}`);
      if (labResponse.data && labResponse.data.labOrders) {
        setPatientLabOrders(labResponse.data.labOrders);
      }
    } catch (error) {
      console.error('Failed to fetch patient data:', error);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setCurrentEncounterId(patient.encounterId || null);
    setNurseIntake(null);
    setVitals(null);
    setEncounters([]);
    setPatientLabOrders([]);
    setCurrentStep('intake'); // Reset workflow to first step
    fetchPatientData(patient.patientId, patient.encounterId);

    // If patient is pending, automatically accept into consultation
    if (patient.status === 'waiting' && patient.assignmentId) {
      handleAcceptPatient(patient.assignmentId);
    }
  };

  const handleEncounterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    try {
      const targetEncounterId = selectedPatient.encounterId || currentEncounterId;
      let response: { data?: { id?: string; encounter?: { id?: string } } | null; error?: string | null };
      if (targetEncounterId) {
        response = await apiClient.patch(`/medical/encounters/${targetEncounterId}`, {
          chiefComplaint: encounterForm.chiefComplaint,
          subjective: encounterForm.subjective,
          objective: encounterForm.objective,
          assessment: encounterForm.assessment,
          plan: encounterForm.plan,
          icd10Code: encounterForm.icd10Code || undefined,
          labResultInterpretation: encounterForm.labResultInterpretation || undefined
        });
      } else {
        response = await apiClient.post(`/medical/patients/${selectedPatient.patientId}/encounters`, {
          chiefComplaint: encounterForm.chiefComplaint,
          subjective: encounterForm.subjective,
          objective: encounterForm.objective,
          assessment: encounterForm.assessment,
          plan: encounterForm.plan,
          icd10Code: encounterForm.icd10Code || undefined,
          labResultInterpretation: encounterForm.labResultInterpretation || undefined
        });
      }

      if (response.error) {
        showError(`Failed to save encounter: ${response.error}`);
        return;
      }

      // Save encounter ID for prescription printing
      const savedId = targetEncounterId || (response.data && typeof response.data === 'object' && ('id' in response.data ? response.data.id : response.data.encounter?.id));
      if (savedId) {
        setCurrentEncounterId(savedId as string);
      }

      showSuccess('Encounter saved successfully!');
      completeStep('encounter'); // Mark encounter step as completed
      const nextStep = getNextStep('encounter');
      if (nextStep) setCurrentStep(nextStep);
      
      setEncounterForm({
        chiefComplaint: '',
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
        icd10Code: '',
        labResultInterpretation: ''
      });
      fetchPatientData(selectedPatient.patientId);
    } catch (error) {
      console.error('Encounter save error:', error);
      showError('Failed to save encounter. Please try again.');
    }
  };

  const handleAutoPopulateLabSummary = () => {
    if (!patientLabOrders || patientLabOrders.length === 0) return;
    const summaryLines: string[] = [];
    patientLabOrders.forEach((o) => {
      if (o.results) {
        o.results.forEach((r: LabResult) => {
          summaryLines.push(`• ${r.labTest?.name || 'Lab Test'}: ${r.value} ${r.unit || ''} [Flag: ${r.flag || 'N'}, Ref: ${r.referenceRange || 'N/A'}]`);
        });
      }
    });
    if (summaryLines.length === 0) return;

    const summaryText = summaryLines.join('\n');
    setEncounterForm(prev => ({
      ...prev,
      objective: prev.objective ? `${prev.objective}\n\n[Lab Results Summary]:\n${summaryText}` : `[Lab Results Summary]:\n${summaryText}`,
      labResultInterpretation: prev.labResultInterpretation ? `${prev.labResultInterpretation}\n\n${summaryText}` : `Lab Findings Summary:\n${summaryText}`
    }));
  };

  const cdsRecommendations = evaluateCdsRules(patientLabOrders);

  const handlePrescriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    // Append prescription to the plan field
    const prescriptionText = `• ${prescriptionForm.medication} - ${prescriptionForm.dosage}, ${prescriptionForm.frequency} for ${prescriptionForm.duration}`;
    const updatedPlan = encounterForm.plan ? `${encounterForm.plan}\n${prescriptionText}` : prescriptionText;

    setEncounterForm({...encounterForm, plan: updatedPlan});
    setPrescriptionForm({
      medication: '',
      dosage: '',
      frequency: '',
      duration: ''
    });
    showInfo('Prescription added to treatment plan!');
  };

  const handlePrintPrescription = async () => {
    if (!currentEncounterId) {
      showInfo('Please save the encounter first before printing prescription');
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const prescriptionUrl = `${apiUrl}/medical/prescription/${currentEncounterId}`;
      
      // Open in new window for printing
      const newWindow = window.open(prescriptionUrl, '_blank');
      if (newWindow) {
        newWindow.onload = () => {
          newWindow.print();
        };
      }
    } catch (error) {
      console.error('Failed to print prescription:', error);
      showError('Failed to generate prescription');
    }
  };

  const handleLabOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    try {
      const response = await apiClient.post<{ labOrder: { id: string } }>('/lab/orders', {
        encounterId: (selectedPatient as any).encounterId || selectedPatient.id,
        patientId: selectedPatient.patientId,
        doctorId: user?.staffProfile?.id || user?.id || '',
        testType: labOrderForm.testType,
        priority: labOrderForm.priority,
        notes: labOrderForm.notes
      });

      if (response.error) {
        showError(`Failed to create lab order: ${response.error}`);
        return;
      }

      // If a lab technician was selected, assign them to the lab order
      if (labOrderForm.labTechId && response.data?.labOrder?.id) {
        try {
          await apiClient.post('/assignments/lab-tech/assign', {
            labOrderId: response.data.labOrder.id,
            labTechId: labOrderForm.labTechId
          });
        } catch (assignmentError) {
          console.error('Failed to assign lab technician:', assignmentError);
          showError('Lab order created but failed to assign lab technician');
        }
      }

      showSuccess('Lab order created successfully!');
      completeStep('orders'); // Mark orders step as completed
      const nextStep = getNextStep('orders');
      if (nextStep) setCurrentStep(nextStep);
      
      setLabOrderForm({
        testType: '',
        priority: 'routine',
        notes: '',
        labTechId: ''
      });
      fetchAvailableLabTechs();
    } catch (error) {
      console.error('Lab order error:', error);
      showError('Failed to create lab order. Please try again.');
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'stat': return 'bg-red-100 text-red-700 border-red-300';
      case 'urgent': return 'bg-orange-100 text-orange-700 border-orange-300';
      default: return 'bg-green-100 text-green-700 border-green-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in-progress': return <Activity className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {navTab === 'doctor-patients' && (
      <>
      {/* Left Sidebar - Patient Queue (30%) */}
      <div className="w-[30%] border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Today's Patients
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchDoctorPatients(false)}
                title="Refresh patient queue"
                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200 shadow-none hover:shadow-sm"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
              </button>
              <button
                onClick={handleToggleAvailability}
                title={isAvailable ? 'Status: Available (Click to change)' : 'Status: Unavailable (Click to change)'}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                  isAvailable ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isAvailable ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                <span>{isAvailable ? 'Available' : 'Unavailable'}</span>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>{patients.length} assigned patient{patients.length === 1 ? '' : 's'}</span>
            <span className="flex items-center text-green-600 font-medium">
              <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
              Live Sync
            </span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-gray-500 flex flex-col items-center">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-500 mb-2" />
              <span>Loading patients...</span>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-medium">No patients waiting</p>
              <p className="text-xs text-gray-400 mt-1">Patients assigned by triage nurse will appear here</p>
            </div>
          ) : (
            patients.map((patient) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => handlePatientSelect(patient)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-blue-50 ${
                  selectedPatient?.id === patient.id ? 'bg-blue-100 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{patient.firstName} {patient.lastName}</h3>
                    <div className="flex items-center space-x-3 mt-1">
                      {patient.arrivalTime && (
                        <p className="text-sm text-gray-600 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(patient.arrivalTime).toLocaleDateString()}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {patient.appointmentTime}
                      </p>
                      {patient.spentTime && (
                        <p className="text-sm text-gray-600 flex items-center">
                          <Activity className="h-3 w-3 mr-1" />
                          {patient.spentTime}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getUrgencyColor(patient.urgency)}`}>
                      {patient.urgency.toUpperCase()}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      patient.status === 'waiting'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : patient.status === 'in-progress'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {patient.status === 'waiting' ? '● New Arrival' : '● In Consult'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{patient.reason}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>MRN: {patient.mrn}</span>
                  {patient.status === 'waiting' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePatientSelect(patient);
                      }}
                      className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                    >
                      Start Consult
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Main Stage - Active Patient Chart (70%) */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedPatient ? (
          <>
            {/* Patient Header */}
            <div className="p-6 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedPatient.firstName} {selectedPatient.lastName}</h2>
                    <p className="text-gray-600">{selectedPatient.reason}</p>
                    <p className="text-sm text-gray-500">MRN: {selectedPatient.mrn}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm px-3 py-1 rounded-full border ${getUrgencyColor(selectedPatient.urgency)}`}>
                    {selectedPatient.urgency.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Abnormal Lab Result Alert Banner (Phase 2) */}
            {cdsRecommendations.length > 0 && (
              <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-start justify-between shadow-sm">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900 text-sm">
                      ⚠️ Abnormal Lab Results Alert ({cdsRecommendations.length} finding{cdsRecommendations.length > 1 ? 's' : ''})
                    </h4>
                    <ul className="mt-1 space-y-1 text-xs text-amber-800">
                      {cdsRecommendations.map((rec) => (
                        <li key={rec.id}>
                          <span className="font-bold">{rec.testName}:</span> {rec.value} (Flag: <span className="font-bold">{rec.flag}</span>) — {rec.recommendation}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentStep('lab-results')}
                  className="px-3 py-1 bg-amber-600 text-white text-xs font-semibold rounded hover:bg-amber-700 transition-colors"
                >
                  View Details
                </button>
              </div>
            )}

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {currentStep === 'intake' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    Nurse Intake Notes
                  </h3>
                  {nurseIntake ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint</label>
                        <p className="p-3 bg-gray-50 rounded-lg text-gray-900">{nurseIntake.chiefComplaint}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Medications</label>
                        <p className="p-3 bg-gray-50 rounded-lg text-gray-900">{nurseIntake.currentMedications || 'None reported'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                        <p className="p-3 bg-gray-50 rounded-lg text-gray-900">{nurseIntake.allergies || 'None reported'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medical History</label>
                        <p className="p-3 bg-gray-50 rounded-lg text-gray-900">{nurseIntake.medicalHistory || 'None reported'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nurse Notes</label>
                        <p className="p-3 bg-gray-50 rounded-lg text-gray-900">{nurseIntake.notes || 'No additional notes'}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-4">Recorded: {new Date(nurseIntake.recordedAt).toLocaleString()}</p>
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => {
                            completeStep('intake');
                            const nextStep = getNextStep('intake');
                            if (nextStep) setCurrentStep(nextStep);
                          }}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Complete Intake & Continue to Vitals
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No nurse intake recorded yet</p>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 'vitals' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <HeartPulse className="h-5 w-5 mr-2 text-blue-600" />
                    Patient Vitals
                  </h3>
                  {vitals ? (
                    <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Activity className="h-4 w-4 mr-2 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">Blood Pressure</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{vitals.bloodPressure}</p>
                        <p className="text-xs text-gray-500">mmHg</p>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg">
                        <div className="flex items-center mb-2">
                          <HeartPulse className="h-4 w-4 mr-2 text-red-600" />
                          <span className="text-sm font-medium text-gray-700">Heart Rate</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{vitals.heartRate}</p>
                        <p className="text-xs text-gray-500">bpm</p>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Thermometer className="h-4 w-4 mr-2 text-orange-600" />
                          <span className="text-sm font-medium text-gray-700">Temperature</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{vitals.temperature}</p>
                        <p className="text-xs text-gray-500">°C</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Activity className="h-4 w-4 mr-2 text-green-600" />
                          <span className="text-sm font-medium text-gray-700">SpO2</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{vitals.spo2}</p>
                        <p className="text-xs text-gray-500">%</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Scale className="h-4 w-4 mr-2 text-purple-600" />
                          <span className="text-sm font-medium text-gray-700">Weight</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{vitals.weight}</p>
                        <p className="text-xs text-gray-500">kg</p>
                      </div>
                      <div className="p-4 bg-indigo-50 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Activity className="h-4 w-4 mr-2 text-indigo-600" />
                          <span className="text-sm font-medium text-gray-700">Height</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{vitals.height}</p>
                        <p className="text-xs text-gray-500">cm</p>
                      </div>
                      <div className="p-4 bg-teal-50 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Activity className="h-4 w-4 mr-2 text-teal-600" />
                          <span className="text-sm font-medium text-gray-700">Resp Rate</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{vitals.respiratoryRate}</p>
                        <p className="text-xs text-gray-500">breaths/min</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">Recorded: {new Date(vitals.recordedAt).toLocaleString()}</p>
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          completeStep('vitals');
                          const nextStep = getNextStep('vitals');
                          if (nextStep) setCurrentStep(nextStep);
                        }}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Complete Vitals & Continue to Encounter
                      </button>
                    </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <HeartPulse className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No vitals recorded yet</p>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 'encounter' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    Clinical Encounter (SOAP Notes)
                  </h3>
                  <form onSubmit={handleEncounterSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint</label>
                      <input
                        type="text"
                        value={encounterForm.chiefComplaint}
                        onChange={(e) => setEncounterForm({...encounterForm, chiefComplaint: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subjective</label>
                      <textarea
                        value={encounterForm.subjective}
                        onChange={(e) => setEncounterForm({...encounterForm, subjective: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Objective</label>
                      <textarea
                        value={encounterForm.objective}
                        onChange={(e) => setEncounterForm({...encounterForm, objective: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assessment</label>
                      <textarea
                        value={encounterForm.assessment}
                        onChange={(e) => setEncounterForm({...encounterForm, assessment: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                      <textarea
                        value={encounterForm.plan}
                        onChange={(e) => setEncounterForm({...encounterForm, plan: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ICD-10 Code (optional)</label>
                      <input
                        type="text"
                        value={encounterForm.icd10Code}
                        onChange={(e) => setEncounterForm({...encounterForm, icd10Code: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          const prevStep = getPreviousStep('encounter');
                          if (prevStep) setCurrentStep(prevStep);
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Save Encounter & Continue
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {currentStep === 'orders' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Beaker className="h-5 w-5 mr-2 text-blue-600" />
                    Lab Orders & Prescriptions
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Lab Order</h4>
                      <form onSubmit={handleLabOrderSubmit} className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Test Type</label>
                          <input
                            type="text"
                            value={labOrderForm.testType}
                            onChange={(e) => setLabOrderForm({...labOrderForm, testType: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                          <select
                            value={labOrderForm.priority}
                            onChange={(e) => setLabOrderForm({...labOrderForm, priority: e.target.value as any})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="routine">Routine</option>
                            <option value="urgent">Urgent</option>
                            <option value="stat">STAT</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Assign Lab Technician (Optional)</label>
                          <select
                            value={labOrderForm.labTechId}
                            onChange={(e) => setLabOrderForm({...labOrderForm, labTechId: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Auto-assign to available technician</option>
                            {availableLabTechs.map((tech) => (
                              <option key={tech.id} value={tech.id}>
                                {tech.staffProfile?.fullName || tech.username} 
                                {tech.isAvailable ? ' (Available)' : ' (Busy)'}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea
                            value={labOrderForm.notes}
                            onChange={(e) => setLabOrderForm({...labOrderForm, notes: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={2}
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Create Lab Order
                        </button>
                      </form>
                    </div>
                    <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          const prevStep = getPreviousStep('orders');
                          if (prevStep) setCurrentStep(prevStep);
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => {
                          completeStep('orders');
                          const nextStep = getNextStep('orders');
                          if (nextStep) setCurrentStep(nextStep);
                        }}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Complete Orders & Continue
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'lab-results' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
                    Lab Results
                  </h3>
                  {patientLabOrders && patientLabOrders.length > 0 ? (
                    <div className="space-y-6">
                      {patientLabOrders.map((order) => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <span className="font-semibold text-gray-900">Lab Order #{order.id.substring(0, 8)}</span>
                              <span className="ml-3 text-xs text-gray-500">
                                {new Date(order.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          {order.results && order.results.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg overflow-hidden border">
                                <thead className="bg-gray-100 text-xs font-medium text-gray-600 uppercase">
                                  <tr>
                                    <th className="px-4 py-2 text-left">Test Name</th>
                                    <th className="px-4 py-2 text-left">Result</th>
                                    <th className="px-4 py-2 text-left">Unit</th>
                                    <th className="px-4 py-2 text-left">Ref. Range</th>
                                    <th className="px-4 py-2 text-left">Flag</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 text-sm">
                                  {order.results.map((res: LabResult) => (
                                    <tr key={res.id}>
                                      <td className="px-4 py-2.5 font-medium text-gray-900">
                                        {res.labTest?.name || 'General Lab Test'}
                                      </td>
                                      <td className="px-4 py-2.5 font-semibold text-gray-900">{res.value}</td>
                                      <td className="px-4 py-2.5 text-gray-600">{res.unit || '-'}</td>
                                      <td className="px-4 py-2.5 text-gray-600">{res.referenceRange || '-'}</td>
                                      <td className="px-4 py-2.5">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                          res.flag === 'H' ? 'bg-red-100 text-red-700 border border-red-200' :
                                          res.flag === 'L' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                          'bg-green-100 text-green-700 border border-green-200'
                                        }`}>
                                          {res.flag === 'H' ? 'H (High)' : res.flag === 'L' ? 'L (Low)' : 'N (Normal)'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No lab results entered yet for this order.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No lab orders or results found for this patient</p>
                    </div>
                  )}
                  <div className="flex items-center space-x-3 pt-4 border-t border-gray-200 mt-6">
                    <button
                      onClick={() => {
                        const prevStep = getPreviousStep('lab-results');
                        if (prevStep) setCurrentStep(prevStep);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => {
                        completeStep('lab-results');
                        showSuccess('Patient workflow completed!');
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Complete Workflow
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Select a patient to view their chart</p>
              </div>
            </div>
          )}
        </div>
      </>
      )}

      {navTab !== 'doctor-patients' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium">{navTab.replace('doctor-', '').charAt(0).toUpperCase() + navTab.replace('doctor-', '').slice(1)} view coming soon</p>
          </div>
        </div>
      )}
    </div>
  );
}