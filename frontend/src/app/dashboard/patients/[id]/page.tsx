'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  AlertTriangle,
  Activity,
  FileText,
  Edit,
  ArrowLeft,
  Plus,
  Clock,
  HeartPulse,
  Pill,
  Beaker,
  DollarSign,
  Download,
  History,
  Save,
  X
} from 'lucide-react';

interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  phone: string;
  email?: string;
  nationalId?: string;
  address?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  allergies?: Array<{
    id: string;
    substance: string;
    severity: string;
    notes?: string;
  }>;
  createdAt: string;
  lastActivityAt: string;
}

interface EditablePatient {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  bloodGroup: string;
  emergencyContact: string;
}

interface TimelineEvent {
  type: 'appointment' | 'encounter' | 'invoice';
  date: Date;
  data: any;
}

export default function PatientProfilePage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'allergies' | 'timeline'>('overview');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditablePatient>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    bloodGroup: '',
    emergencyContact: ''
  });

  useEffect(() => {
    if (params.id) {
      fetchPatientData(params.id);
    }
  }, [params.id]);

  const fetchPatientData = async (patientId: string) => {
    try {
      setLoading(true);
      // In a real implementation, this would call your API
      // const response = await apiClient.get(`/patients/${patientId}`);
      // setPatient(response.data.patient);
      
      // For now, using mock data
      const mockPatient: Patient = {
        id: patientId,
        mrn: 'MRN-2024-123456',
        firstName: 'John',
        lastName: 'Doe',
        dob: '1985-05-15',
        gender: 'MALE',
        phone: '+1555123456',
        email: 'john.doe@example.com',
        nationalId: '1234567890123',
        address: '123 Main St, City, State',
        bloodGroup: 'O+',
        emergencyContact: '+1555987654 (Jane Doe)',
        allergies: [
          {
            id: '1',
            substance: 'Penicillin',
            severity: 'SEVERE',
            notes: 'Anaphylactic reaction'
          }
        ],
        createdAt: '2024-01-15T10:00:00Z',
        lastActivityAt: '2024-08-17T14:30:00Z'
      };
      
      setPatient(mockPatient);
      
      // Mock timeline data
      const mockTimeline: TimelineEvent[] = [
        {
          type: 'appointment',
          date: new Date('2024-08-17T10:00:00Z'),
          data: { reason: 'Annual Checkup', status: 'COMPLETED' }
        },
        {
          type: 'encounter',
          date: new Date('2024-08-17T10:30:00Z'),
          data: { chiefComplaint: 'Routine examination', assessment: 'Healthy' }
        },
        {
          type: 'invoice',
          date: new Date('2024-08-17T11:00:00Z'),
          data: { total: 150.00, status: 'PAID' }
        }
      ];
      
      setTimeline(mockTimeline);
    } catch (error) {
      console.error('Error fetching patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleEdit = () => {
    if (patient) {
      setEditForm({
        firstName: patient.firstName,
        lastName: patient.lastName,
        phone: patient.phone,
        email: patient.email || '',
        address: patient.address || '',
        bloodGroup: patient.bloodGroup || '',
        emergencyContact: patient.emergencyContact || ''
      });
      setEditing(true);
    }
  };

  const handleSave = async () => {
    try {
      // In a real implementation, this would call your API
      // await apiClient.patch(`/patients/mrn/${patient.mrn}`, editForm);
      
      // Update local state
      if (patient) {
        setPatient({
          ...patient,
          ...editForm
        });
      }
      
      setEditing(false);
      showSuccess('Patient information updated successfully');
    } catch (error) {
      console.error('Error updating patient:', error);
      showError('Failed to update patient information');
    }
  };

  const handleCancel = () => {
    setEditing(false);
    if (patient) {
      setEditForm({
        firstName: patient.firstName,
        lastName: patient.lastName,
        phone: patient.phone,
        email: patient.email || '',
        address: patient.address || '',
        bloodGroup: patient.bloodGroup || '',
        emergencyContact: patient.emergencyContact || ''
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'SEVERE': return 'bg-red-100 text-red-700 border-red-300';
      case 'MODERATE': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'MILD': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-green-100 text-green-700 border-green-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Patient not found</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {patient.firstName} {patient.lastName}
                </h1>
                <p className="text-sm text-gray-600">MRN: {patient.mrn}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Download className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={() => editing ? handleCancel() : handleEdit()}
                className={`p-2 rounded-lg transition-colors ${
                  editing ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {editing ? <ArrowLeft className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-0">
            {(['overview', 'history', 'allergies', 'timeline'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-medium transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Patient Information Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Patient Information
                </h2>
              </div>
              <div className="p-6">
                {editing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 mb-1">First Name</label>
                        <input
                          type="text"
                          value={editForm.firstName}
                          onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 mb-1">Last Name</label>
                        <input
                          type="text"
                          value={editForm.lastName}
                          onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 mb-1">Email</label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-500 mb-1">Address</label>
                        <input
                          type="text"
                          value={editForm.address}
                          onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 mb-1">Blood Group</label>
                        <select
                          value={editForm.bloodGroup}
                          onChange={(e) => setEditForm({...editForm, bloodGroup: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select</option>
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
                      <div>
                        <label className="text-sm font-medium text-gray-500 mb-1">Emergency Contact</label>
                        <input
                          type="text"
                          value={editForm.emergencyContact}
                          onChange={(e) => setEditForm({...editForm, emergencyContact: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="text-gray-900 font-medium">{patient.firstName} {patient.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Age</label>
                      <p className="text-gray-900 font-medium">{getAge(patient.dob)} years old</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Gender</label>
                      <p className="text-gray-900 font-medium">{patient.gender}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                      <p className="text-gray-900 font-medium">{new Date(patient.dob).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Blood Group</label>
                      <p className="text-gray-900 font-medium">{patient.bloodGroup || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">MRN</label>
                      <p className="text-gray-900 font-medium">{patient.mrn}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-gray-900 font-medium flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {patient.phone}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900 font-medium flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {patient.email || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">National ID</label>
                      <p className="text-gray-900 font-medium">{patient.nationalId || 'Not provided'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <p className="text-gray-900 font-medium flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        {patient.address || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Emergency Contact</label>
                      <p className="text-gray-900 font-medium">{patient.emergencyContact || 'Not provided'}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Allergies Alert */}
            {patient.allergies && patient.allergies.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-red-50 border border-red-200 rounded-xl p-6"
              >
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900 mb-3">Known Allergies</h3>
                    <div className="space-y-2">
                      {patient.allergies.map((allergy) => (
                        <div
                          key={allergy.id}
                          className={`p-3 rounded-lg border ${getSeverityColor(allergy.severity)}`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{allergy.substance}</p>
                              {allergy.notes && (
                                <p className="text-sm mt-1">{allergy.notes}</p>
                              )}
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full border bg-white">
                              {allergy.severity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <History className="h-5 w-5 mr-2 text-green-600" />
                  Medical History
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <Activity className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Annual Checkup</p>
                      <p className="text-sm text-gray-600">June 15, 2024 - Dr. Smith</p>
                      <p className="text-sm text-gray-500 mt-1">Routine examination, blood work normal</p>
                    </div>
                  </div>
                  <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                    <div className="bg-green-100 p-2 rounded-full mr-3">
                      <HeartPulse className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Follow-up Visit</p>
                      <p className="text-sm text-gray-600">March 10, 2024 - Dr. Johnson</p>
                      <p className="text-sm text-gray-500 mt-1">Blood pressure monitoring, medication adjustment</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === 'allergies' && (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                    Allergy Information
                  </h2>
                  <button className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Allergy
                  </button>
                </div>
              </div>
              <div className="p-6">
                {patient.allergies && patient.allergies.length > 0 ? (
                  <div className="space-y-3">
                    {patient.allergies.map((allergy) => (
                      <div
                        key={allergy.id}
                        className={`p-4 rounded-lg border ${getSeverityColor(allergy.severity)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium">{allergy.substance}</p>
                              <span className="text-xs px-2 py-1 rounded-full border bg-white">
                                {allergy.severity}
                              </span>
                            </div>
                            {allergy.notes && (
                              <p className="text-sm mt-2">{allergy.notes}</p>
                            )}
                          </div>
                          <button className="text-gray-400 hover:text-red-600">
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No known allergies recorded</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-purple-600" />
                  Patient Timeline
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {timeline.map((event, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="flex flex-col items-center">
                        <div className={`p-2 rounded-full ${
                          event.type === 'appointment' ? 'bg-blue-100' :
                          event.type === 'encounter' ? 'bg-green-100' :
                          'bg-purple-100'
                        }`}>
                          {event.type === 'appointment' && <Calendar className="h-4 w-4 text-blue-600" />}
                          {event.type === 'encounter' && <Activity className="h-4 w-4 text-green-600" />}
                          {event.type === 'invoice' && <DollarSign className="h-4 w-4 text-purple-600" />}
                        </div>
                        {index < timeline.length - 1 && (
                          <div className="w-0.5 h-12 bg-gray-300 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-500 mb-1">
                            {event.date.toLocaleDateString()} at {event.date.toLocaleTimeString()}
                          </p>
                          <p className="font-medium text-gray-900 capitalize">{event.type}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {event.type === 'appointment' && `Reason: ${event.data.reason}`}
                            {event.type === 'encounter' && `Chief Complaint: ${event.data.chiefComplaint}`}
                            {event.type === 'invoice' && `Total: $${event.data.total}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}