'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api';
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
  X,
  Save,
  Printer
} from 'lucide-react';

interface Patient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  mrn: string;
  appointmentTime: string;
  reason: string;
  status: 'waiting' | 'in-progress' | 'completed';
  urgency: 'routine' | 'urgent' | 'stat';
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
}

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<'intake' | 'vitals' | 'encounter' | 'orders' | 'lab-results'>('intake');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [nurseIntake, setNurseIntake] = useState<NurseIntake | null>(null);
  const [vitals, setVitals] = useState<Vitals | null>(null);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [patientLabOrders, setPatientLabOrders] = useState<any[]>([]);

  const [encounterForm, setEncounterForm] = useState({
    chiefComplaint: '',
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    icd10Code: '',
    labResultInterpretation: ''
  });

  const [prescriptionForm, setPrescriptionForm] = useState({
    medication: '',
    dosage: '',
    frequency: '',
    duration: ''
  });

  const [currentEncounterId, setCurrentEncounterId] = useState<string | null>(null);

  const [labOrderForm, setLabOrderForm] = useState({
    testType: '',
    priority: 'routine' as 'routine' | 'urgent' | 'stat',
    notes: '',
    labTechId: ''
  });

  const [availableLabTechs, setAvailableLabTechs] = useState<any[]>([]);

  useEffect(() => {
    fetchDoctorPatients();
    fetchAvailableLabTechs();
  }, []);

  const fetchAvailableLabTechs = async () => {
    try {
      const response = await apiClient.get<{ labTechs: any[] }>('/assignments/lab-techs/available');
      if (response.data) {
        setAvailableLabTechs(response.data.labTechs);
      }
    } catch (error) {
      console.error('Failed to fetch available lab technicians:', error);
    }
  };

  const fetchDoctorPatients = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<{ assignments: any[] }>('/assignments/doctor/my-assignments');
      if (response.data) {
        const allPatients = response.data.assignments.map((a: any) => ({
          id: a.id,
          assignmentId: a.id,
          patientId: a.encounter.patient.id,
          firstName: a.encounter.patient.firstName,
          lastName: a.encounter.patient.lastName,
          mrn: a.encounter.patient.mrn,
          appointmentTime: new Date(a.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: (a.status === 'PENDING' ? 'waiting' : a.status === 'ACCEPTED' ? 'in-progress' : 'completed') as 'waiting' | 'in-progress' | 'completed',
          urgency: 'routine' as const,
          reason: 'Nurse Examination Complete',
          encounterId: a.encounterId
        }));
        setPatients(allPatients);
      }
    } catch (error) {
      console.error('Failed to fetch doctor assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientData = async (patientId: string) => {
    try {
      // Fetch encounters (includes nurse intake)
      const encounterResponse = await apiClient.get<{ encounters: any[] }>(`/medical/patients/${patientId}/encounters`);
      if (encounterResponse.data && encounterResponse.data.encounters.length > 0) {
        const latestEncounter = encounterResponse.data.encounters[0];
        
        // Parse subjective data for nurse intake information
        const subjective = latestEncounter.subjective || '';
        const chiefComplaintMatch = subjective.match(/Chief Complaint: (.+)/);
        const medicationsMatch = subjective.match(/Current Medications: (.+)/);
        const allergiesMatch = subjective.match(/Allergies: (.+)/);
        const historyMatch = subjective.match(/Medical History: (.+)/);
        
        setNurseIntake({
          chiefComplaint: chiefComplaintMatch?.[1] || latestEncounter.chiefComplaint || '',
          currentMedications: medicationsMatch?.[1] || '',
          allergies: allergiesMatch?.[1] || '',
          medicalHistory: historyMatch?.[1] || '',
          notes: latestEncounter.plan || '',
          recordedAt: latestEncounter.createdAt
        });
        setEncounters(encounterResponse.data.encounters.map((e: any) => ({
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

      // Fetch vitals
      const vitalsResponse = await apiClient.get<{ vitals: any[] }>(`/medical/patients/${patientId}/vitals`);
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

      // Fetch patient lab history & results
      const labResponse = await apiClient.get<{ labOrders: any[] }>(`/lab/patient/${patientId}`);
      if (labResponse.data && labResponse.data.labOrders) {
        setPatientLabOrders(labResponse.data.labOrders);
      }
    } catch (error) {
      console.error('Failed to fetch patient data:', error);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setNurseIntake(null);
    setVitals(null);
    setEncounters([]);
    setPatientLabOrders([]);
    fetchPatientData(patient.patientId);
  };

  const handleEncounterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    try {
      const response = await apiClient.post(`/medical/patients/${selectedPatient.patientId}/encounters`, {
        chiefComplaint: encounterForm.chiefComplaint,
        subjective: encounterForm.subjective,
        objective: encounterForm.objective,
        assessment: encounterForm.assessment,
        plan: encounterForm.plan,
        icd10Code: encounterForm.icd10Code || undefined,
        labResultInterpretation: encounterForm.labResultInterpretation || undefined
      });

      if (response.error) {
        showError(`Failed to save encounter: ${response.error}`);
        return;
      }

      // Save encounter ID for prescription printing
      if (response.data && typeof response.data === 'object' && 'id' in response.data) {
        setCurrentEncounterId(response.data.id as string);
      }

      showSuccess('Encounter saved successfully!');
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
        o.results.forEach((r: any) => {
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
        doctorId: user?.staffProfile?.id || '',
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
      {/* Left Sidebar - Patient Queue (30%) */}
      <div className="w-[30%] border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Today's Patients
          </h2>
          <p className="text-sm text-gray-600 mt-1">{patients.length} appointments</p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading patients...</div>
          ) : patients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No patients scheduled</p>
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
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {patient.appointmentTime}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getUrgencyColor(patient.urgency)}`}>
                    {patient.urgency.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{patient.reason}</p>
                <p className="text-xs text-gray-500">MRN: {patient.mrn}</p>
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
                  onClick={() => setActiveTab('lab-results')}
                  className="px-3 py-1 bg-amber-600 text-white text-xs font-semibold rounded hover:bg-amber-700 transition-colors"
                >
                  View Details
                </button>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 bg-white">
              <div className="flex space-x-0">
                {(['intake', 'vitals', 'encounter', 'orders', 'lab-results'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-4 py-4 font-medium transition-colors border-b-2 flex items-center justify-center text-sm ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {tab === 'intake' && <FileText className="h-4 w-4 mr-1.5" />}
                    {tab === 'vitals' && <HeartPulse className="h-4 w-4 mr-1.5" />}
                    {tab === 'encounter' && <Stethoscope className="h-4 w-4 mr-1.5" />}
                    {tab === 'orders' && <Pill className="h-4 w-4 mr-1.5" />}
                    {tab === 'lab-results' && <FlaskConical className="h-4 w-4 mr-1.5" />}
                    {tab === 'lab-results' ? 'Lab Results' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'intake' && (
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
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No nurse intake recorded yet</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'vitals' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <HeartPulse className="h-5 w-5 mr-2 text-blue-600" />
                    Patient Vitals
                  </h3>
                  {vitals ? (
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
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <HeartPulse className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No vitals recorded yet</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'lab-results' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FlaskConical className="h-5 w-5 mr-2 text-blue-600" />
                    Patient Lab Results
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
                                    <th className="px-4 py-2 text-left">Timestamp</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 text-sm">
                                  {order.results.map((res: any) => (
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
                                      <td className="px-4 py-2.5 text-xs text-gray-500">
                                        {new Date(res.enteredAt).toLocaleString()}
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
                      <FlaskConical className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No lab orders or results found for this patient</p>
                    </div>
                  )}
                </div>
              )}

               {activeTab === 'encounter' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <Stethoscope className="h-5 w-5 mr-2 text-blue-600" />
                    Clinical Encounter
                  </h3>

                  {/* CDS Recommendations Component (Phase 3) */}
                  {cdsRecommendations.length > 0 && (
                    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-indigo-900 text-sm flex items-center">
                          <Activity className="h-4 w-4 mr-1.5 text-indigo-600" />
                          Clinical Decision Support (CDS) Suggestions
                        </h4>
                        <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded font-medium">
                          {cdsRecommendations.length} Rule Match{cdsRecommendations.length > 1 ? 'es' : ''}
                        </span>
                      </div>
                      {cdsRecommendations.map((rec) => (
                        <div key={rec.id} className="bg-white p-3 rounded border border-indigo-100 text-xs text-gray-700 space-y-2">
                          <div className="font-medium text-gray-900">{rec.title} ({rec.value})</div>
                          <p className="text-gray-600">{rec.recommendation}</p>
                          <div className="flex space-x-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEncounterForm(prev => ({
                                  ...prev,
                                  plan: prev.plan ? `${prev.plan}\n\n• ${rec.suggestedPlanEntry}` : `• ${rec.suggestedPlanEntry}`,
                                  labResultInterpretation: prev.labResultInterpretation ? `${prev.labResultInterpretation}\n\n• ${rec.title}: ${rec.recommendation}` : `• ${rec.title}: ${rec.recommendation}`
                                }));
                              }}
                              className="px-2.5 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 font-medium"
                            >
                              + Apply CDS to Plan & Interpretation
                            </button>
                            {rec.suggestedFollowUpTests.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setLabOrderForm(prev => ({
                                    ...prev,
                                    testType: rec.suggestedFollowUpTests[0],
                                    notes: `Follow-up for ${rec.testName} (${rec.value})`
                                  }));
                                  setActiveTab('orders');
                                }}
                                className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 font-medium"
                              >
                                + Order Follow-up ({rec.suggestedFollowUpTests[0]})
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleEncounterSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint</label>
                      <textarea
                        required
                        value={encounterForm.chiefComplaint}
                        onChange={(e) => setEncounterForm({...encounterForm, chiefComplaint: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                        placeholder="Patient's main concern..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subjective (HPI)</label>
                      <textarea
                        value={encounterForm.subjective}
                        onChange={(e) => setEncounterForm({...encounterForm, subjective: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                        placeholder="Patient's description of symptoms..."
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">Objective (Exam & Lab Findings)</label>
                        {patientLabOrders.some(o => o.results && o.results.length > 0) && (
                          <button
                            type="button"
                            onClick={handleAutoPopulateLabSummary}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
                          >
                            <FlaskConical className="h-3.5 w-3.5 mr-1" />
                            Auto-populate Lab Summary
                          </button>
                        )}
                      </div>
                      <textarea
                        value={encounterForm.objective}
                        onChange={(e) => setEncounterForm({...encounterForm, objective: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                        placeholder="Physical examination & lab summary findings..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lab Result Interpretation</label>
                      <textarea
                        value={encounterForm.labResultInterpretation}
                        onChange={(e) => setEncounterForm({...encounterForm, labResultInterpretation: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                        placeholder="Clinical interpretation of patient's lab results..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assessment (Diagnosis)</label>
                      <textarea
                        value={encounterForm.assessment}
                        onChange={(e) => setEncounterForm({...encounterForm, assessment: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                        placeholder="Clinical assessment..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                      <textarea
                        value={encounterForm.plan}
                        onChange={(e) => setEncounterForm({...encounterForm, plan: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                        placeholder="Treatment plan..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ICD-10 Code</label>
                      <input
                        type="text"
                        value={encounterForm.icd10Code}
                        onChange={(e) => setEncounterForm({...encounterForm, icd10Code: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., J06.9"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
                    >
                      <Save className="h-5 w-5" />
                      <span>Save Encounter</span>
                    </button>
                    {currentEncounterId && (
                      <button
                        type="button"
                        onClick={handlePrintPrescription}
                        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2 mt-3"
                      >
                        <Printer className="h-5 w-5" />
                        <span>Print Prescription</span>
                      </button>
                    )}
                  </form>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Pill className="h-5 w-5 mr-2 text-blue-600" />
                      Prescription
                    </h3>
                    <form onSubmit={handlePrescriptionSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medication</label>
                        <input
                          type="text"
                          required
                          value={prescriptionForm.medication}
                          onChange={(e) => setPrescriptionForm({...prescriptionForm, medication: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Medication name"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                          <input
                            type="text"
                            required
                            value={prescriptionForm.dosage}
                            onChange={(e) => setPrescriptionForm({...prescriptionForm, dosage: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 500mg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                          <input
                            type="text"
                            required
                            value={prescriptionForm.frequency}
                            onChange={(e) => setPrescriptionForm({...prescriptionForm, frequency: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., twice daily"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                        <input
                          type="text"
                          required
                          value={prescriptionForm.duration}
                          onChange={(e) => setPrescriptionForm({...prescriptionForm, duration: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 7 days"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
                      >
                        <Pill className="h-5 w-5" />
                        <span>Create Prescription</span>
                      </button>
                    </form>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <FlaskConical className="h-5 w-5 mr-2 text-blue-600" />
                      Lab Order
                    </h3>
                    <form onSubmit={handleLabOrderSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Test Type</label>
                        <input
                          type="text"
                          required
                          value={labOrderForm.testType}
                          onChange={(e) => setLabOrderForm({...labOrderForm, testType: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., CBC, Lipid Panel"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <select
                          value={labOrderForm.priority}
                          onChange={(e) => setLabOrderForm({...labOrderForm, priority: e.target.value as any})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="routine">Routine</option>
                          <option value="urgent">Urgent</option>
                          <option value="stat">Stat</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assign Lab Technician</label>
                        <select
                          value={labOrderForm.labTechId}
                          onChange={(e) => setLabOrderForm({...labOrderForm, labTechId: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- Select Lab Technician (Optional) --</option>
                          {availableLabTechs.map((tech) => (
                            <option key={tech.id} value={tech.id}>
                              {tech.fullName || tech.user?.username || 'Lab Tech'}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                          value={labOrderForm.notes}
                          onChange={(e) => setLabOrderForm({...labOrderForm, notes: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                          placeholder="Additional instructions..."
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
                      >
                        <FlaskConical className="h-5 w-5" />
                        <span>Create Lab Order</span>
                      </button>
                    </form>
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
    </div>
  );
}